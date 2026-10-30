import type { QuickJSContext, QuickJSWASMModule } from 'quickjs-emscripten-core'
import type { Sandbox, SandboxBridge, SandboxSetup } from '../types'
import {
  CRYPTO_SHIM,
  INTL_SHIM,
  MAX_NUMBER_FORMATS,
  MAX_RANDOM_BYTES,
  SANDBOX_STACK_BYTES,
} from './values'

let engine: Promise<QuickJSWASMModule> | null = null

/** QuickJS, loaded the first time a page runs code — never for one that has none. */
function loadEngine(): Promise<QuickJSWASMModule> {
  if (!engine) {
    const loading = Promise.all([
      import('quickjs-emscripten-core'),
      import('@jitl/quickjs-singlefile-mjs-release-sync'),
    ]).then(([core, variant]) => core.newQuickJSWASMModuleFromVariant(variant.default))
    engine = loading
    // A load that failed (a dropped chunk) is not remembered: the next page tries again.
    loading.catch(() => {
      if (engine === loading) engine = null
    })
  }
  return engine
}

function lend(vm: QuickJSContext, names: string[], current: { bridge: SandboxBridge | null }) {
  for (const name of names) {
    const handle = vm.newFunction(`__bridge_${name}`, (...args) => {
      const answer = current.bridge?.[name]?.(...args.map((arg) => vm.getString(arg)))
      return typeof answer === 'string' ? vm.newString(answer) : vm.undefined
    })
    vm.setProp(vm.global, `__bridge_${name}`, handle)
    handle.dispose()
  }
}

/** Random bytes as hex, from the host's `crypto`: what `CRYPTO_SHIM` builds a package's on. */
function lendRandom(vm: QuickJSContext) {
  const handle = vm.newFunction('__random', (count) => {
    const size = Math.min(MAX_RANDOM_BYTES, Math.max(0, Math.floor(vm.getNumber(count)) || 0))
    const bytes = crypto.getRandomValues(new Uint8Array(size))
    return vm.newString(Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(''))
  })
  vm.setProp(vm.global, '__random', handle)
  handle.dispose()
}

/** The host's `Intl.NumberFormat`, by locale and options as JSON: what `INTL_SHIM` reads through. */
function lendIntl(vm: QuickJSContext) {
  const formats = new Map<string, Intl.NumberFormat>()
  const formatOf = (locales: string, options: string) => {
    const key = `${locales}\u0000${options}`
    const known = formats.get(key)
    if (known) return known
    if (formats.size >= MAX_NUMBER_FORMATS) formats.clear()
    const format = new Intl.NumberFormat(JSON.parse(locales) ?? undefined, JSON.parse(options))
    formats.set(key, format)
    return format
  }
  const answer = (name: string, read: (format: Intl.NumberFormat, value: number) => string) => {
    const handle = vm.newFunction(name, (locales, options, value) => {
      try {
        const format = formatOf(vm.getString(locales), vm.getString(options))
        return vm.newString(read(format, value ? vm.getNumber(value) : Number.NaN))
      } catch (error) {
        const failure = error instanceof Error ? error : new Error(String(error))
        return { error: vm.newError({ name: failure.name, message: failure.message }) }
      }
    })
    vm.setProp(vm.global, name, handle)
    handle.dispose()
  }
  answer('__numberOptions', (format) => JSON.stringify(format.resolvedOptions()))
  answer('__numberFormat', (format, value) => format.format(value))
}

/**
 * A fresh QuickJS: no DOM, no network, no timers, a memory cap and a deadline on every run. Its
 * only ways out are the `__bridge_<name>` functions it was opened with, answered by whatever bridge
 * the current call lends, `__random` behind a Web `crypto` (random bytes, nothing else) and the
 * host's number formats behind `Intl`. The code itself runs once, inside the same deadline; a throw
 * closes it.
 */
export async function openSandbox(js: string, setup: SandboxSetup): Promise<Sandbox> {
  const quickjs = await loadEngine()
  const runtime = quickjs.newRuntime()
  runtime.setMemoryLimit(setup.memoryBytes)
  runtime.setMaxStackSize(SANDBOX_STACK_BYTES)
  const vm = runtime.newContext()
  const current: { bridge: SandboxBridge | null } = { bridge: null }
  lend(vm, setup.names, current)
  lendRandom(vm)
  lendIntl(vm)

  const run = (code: string, bridge: SandboxBridge | null) => {
    current.bridge = bridge
    const deadline = Date.now() + setup.deadlineMs
    runtime.setInterruptHandler(() => Date.now() > deadline)
    const result = vm.evalCode(code)
    current.bridge = null
    if (result.error) {
      const failure = vm.dump(result.error) as { message?: string } | string
      result.error.dispose()
      const message = typeof failure === 'string' ? failure : (failure.message ?? 'it threw')
      return {
        ok: false as const,
        error: message === 'interrupted' ? `ran past ${setup.deadlineMs} ms` : message,
      }
    }
    const value = vm.typeof(result.value) === 'string' ? vm.getString(result.value) : 'null'
    result.value.dispose()
    return { ok: true as const, value }
  }

  // `;` first: a bundle opening with `(` would otherwise call whatever the prelude ended on.
  const opened = run(`${CRYPTO_SHIM};\n${INTL_SHIM};\n${setup.prelude};\n${js}`, null)
  if (!opened.ok) {
    vm.dispose()
    runtime.dispose()
    throw new Error(opened.error)
  }
  return {
    call: run,
    dispose: () => {
      vm.dispose()
      runtime.dispose()
    },
  }
}
