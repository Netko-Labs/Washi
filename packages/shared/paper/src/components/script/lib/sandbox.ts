import type { QuickJSContext, QuickJSWASMModule } from 'quickjs-emscripten-core'
import type { ScriptBridge, ScriptSandbox } from '../../../lib/types'
import { MEMORY_BYTES, prelude, RUN_DEADLINE_MS, STACK_BYTES } from './values'

let engine: Promise<QuickJSWASMModule> | null = null

/** QuickJS, loaded the first time a page has a script — never for one that has none. */
function loadEngine(): Promise<QuickJSWASMModule> {
  engine ??= Promise.all([
    import('quickjs-emscripten-core'),
    import('@jitl/quickjs-singlefile-mjs-release-sync'),
  ]).then(([core, variant]) => core.newQuickJSWASMModuleFromVariant(variant.default))
  return engine
}

function lend(vm: QuickJSContext, current: { bridge: ScriptBridge | null }) {
  const text = (value: string | undefined) =>
    value === undefined ? vm.undefined : vm.newString(value)
  const fns: [string, (...args: string[]) => ReturnType<typeof text> | undefined][] = [
    ['__bridge_state', (key = '') => text(current.bridge?.state(key))],
    ['__bridge_set', (key = '', json = 'null') => void current.bridge?.set(key, json)],
    ['__bridge_rows', (query = '{}') => text(current.bridge?.rows(query))],
    ['__bridge_interval', (ms = '0') => void current.bridge?.interval(Number(ms))],
    ['__bridge_act', (json = '{}') => void current.bridge?.act(json)],
  ]
  for (const [name, fn] of fns) {
    const handle = vm.newFunction(name, (...args) => fn(...args.map((arg) => vm.getString(arg))))
    vm.setProp(vm.global, name, handle)
    handle.dispose()
  }
}

/**
 * A fresh QuickJS for one script: no DOM, no network, no timers, a memory cap and a deadline on
 * every run. The script's own code runs once, inside the same deadline; a throw closes it.
 */
export async function openSandbox(js: string, names: string[]): Promise<ScriptSandbox> {
  const quickjs = await loadEngine()
  const runtime = quickjs.newRuntime()
  runtime.setMemoryLimit(MEMORY_BYTES)
  runtime.setMaxStackSize(STACK_BYTES)
  const vm = runtime.newContext()
  const current: { bridge: ScriptBridge | null } = { bridge: null }
  lend(vm, current)

  const run = (code: string, bridge: ScriptBridge | null) => {
    current.bridge = bridge
    const deadline = Date.now() + RUN_DEADLINE_MS
    runtime.setInterruptHandler(() => Date.now() > deadline)
    const result = vm.evalCode(code)
    current.bridge = null
    if (result.error) {
      const failure = vm.dump(result.error) as { name?: string; message?: string } | string
      result.error.dispose()
      const message = typeof failure === 'string' ? failure : (failure.message ?? 'it threw')
      return {
        ok: false as const,
        error: message === 'interrupted' ? `ran past ${RUN_DEADLINE_MS} ms` : message,
      }
    }
    const value = vm.typeof(result.value) === 'string' ? vm.getString(result.value) : 'null'
    result.value.dispose()
    return { ok: true as const, value }
  }

  const opened = run(`${prelude(names)}\n${js}`, null)
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
