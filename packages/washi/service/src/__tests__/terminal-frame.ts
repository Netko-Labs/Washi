import { createContext, runInContext } from 'node:vm'
import type { PagePackageSet } from '@washi/domain'
import { compileTerminal } from '../pages'

/** What a Terminal's frame showed and said, read off a fake DOM in its own realm. */
export interface TerminalRun {
  painted: string[]
  screen: () => string
  exit: () => number | null
}

const textOf = (node: unknown) =>
  typeof node === 'string' ? node : String((node as { textContent: string }).textContent)

/**
 * A Terminal's bundle run as its frame runs it — a realm of its own, a page that posts `run` with
 * the files — until it exits or `waitMs` passes.
 */
export async function runTerminal(
  program: string,
  files: Record<string, string> = {},
  waitMs = 1000,
  packages: PagePackageSet | null = null,
): Promise<TerminalRun> {
  const compiled = await compileTerminal(program, packages)
  if (!compiled.ok) throw new Error(compiled.error)
  const painted: string[] = []
  const said: { type?: string; code?: number }[] = []
  const heard: ((event: unknown) => void)[] = []
  const pre = {
    style: {},
    clientWidth: 600,
    clientHeight: 300,
    scrollTop: 0,
    scrollHeight: 0,
    set textContent(value: string) {
      painted.push(value)
    },
    replaceChildren(...nodes: unknown[]) {
      painted.push(nodes.map(textOf).join(''))
    },
  }
  const parent = { postMessage: (message: { type?: string; code?: number }) => said.push(message) }
  const element = (tag: string) =>
    tag === 'pre'
      ? pre
      : tag === 'canvas'
        ? { getContext: () => null }
        : { textContent: '', setAttribute() {} }
  const context = createContext({
    document: { getElementById: () => ({ replaceChildren() {} }), createElement: element },
    parent,
    TextEncoder,
    TextDecoder,
    URL,
    URLSearchParams,
    atob,
    btoa,
    performance,
    queueMicrotask,
    setTimeout: (run: () => void, ms?: number) => setTimeout(run, ms),
    clearTimeout: (id: Timer) => clearTimeout(id),
    setInterval: (run: () => void, ms?: number) => setInterval(run, ms),
    clearInterval: (id: Timer) => clearInterval(id),
    requestAnimationFrame: (run: () => void) => setTimeout(run, 0),
    addEventListener: (type: string, listen: (event: unknown) => void) => {
      if (type === 'message') heard.push(listen)
    },
  })
  runInContext(compiled.js, context)
  const bytes = Object.fromEntries(
    Object.entries(files).map(([path, text]) => [path, new TextEncoder().encode(text)]),
  )
  for (const listen of heard)
    listen({ source: parent, data: { washi: true, type: 'run', files: bytes } })
  const exit = () => said.find((message) => message.type === 'exit')?.code ?? null
  const until = Date.now() + waitMs
  while (exit() === null && Date.now() < until) await Bun.sleep(10)
  await Bun.sleep(20)
  return { painted, screen: () => painted.at(-1) ?? '', exit }
}
