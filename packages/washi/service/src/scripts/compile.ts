import type { AutomationEntry } from '@washi/repository'
import type { Diagnostic, WsxElement, WsxNode } from '@washi/wsx'
import type { CompiledScript, FoundScript } from './types'
import { ENTRIES, ENTRY_WORDS } from './values'

/** A script is one page block's worth of TSX, not a program. */
export const SCRIPT_MAX_CHARS = 20_000

const transpiler = new Bun.Transpiler({
  loader: 'tsx',
  tsconfig: { compilerOptions: { jsx: 'react', jsxFactory: 'h', jsxFragmentFactory: 'Fragment' } },
})

/**
 * TSX in, plain JS out, the JSX as `h(Card, …)` calls the sandbox answers. A script imports and
 * exports nothing — everything it may touch arrives as the sandbox's hooks — and names its entry:
 * `view` for a Script a page draws, `run` for an Automation a row write runs.
 */
export function compileScript(source: string, entry = 'view'): CompiledScript {
  if (source.length > SCRIPT_MAX_CHARS) {
    return { ok: false, error: `a script is at most ${SCRIPT_MAX_CHARS} characters` }
  }
  try {
    const { imports, exports } = transpiler.scan(source)
    if (imports.length > 0)
      return { ok: false, error: 'a script imports nothing — its hooks are already there' }
    if (exports.length > 0)
      return { ok: false, error: `a script exports nothing — name a function ${entry}` }
    const js = transpiler.transformSync(source)
    const names = new RegExp(`\\bfunction\\s+${entry}\\s*\\(|\\b(?:const|let|var)\\s+${entry}\\s*=`)
    if (!names.test(js)) {
      return {
        ok: false,
        error: ENTRY_WORDS[entry] ?? `a formula needs a function ${entry}(…) that returns a value`,
      }
    }
    return { ok: true, js }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: message.split('\n')[0] ?? message }
  }
}

function scripts(node: WsxNode, path: string, out: FoundScript[]) {
  if (node.kind !== 'element') return
  const here = path ? `${path} > ${node.name}` : node.name
  const entry =
    node.name === 'Formula' && typeof node.props.name === 'string'
      ? node.props.name
      : ENTRIES[node.name]
  if (entry) out.push({ path: here, entry, source: textOf(node) })
  for (const child of node.children) scripts(child, here, out)
}

export const textOf = (node: WsxElement) =>
  node.children.map((child) => (child.kind === 'text' ? child.value : '')).join('')

/** Every script on the page compiled now, so one that cannot run is refused before it is saved. */
export function scriptDiagnostics(root: WsxElement): Diagnostic[] {
  const found: FoundScript[] = []
  scripts(root, '', found)
  return found.flatMap(({ path, source, entry }) => {
    const compiled = compileScript(source, entry)
    return compiled.ok
      ? []
      : [{ severity: 'error' as const, path, message: `script: ${compiled.error}` }]
  })
}

/** The page's `<Automation>` blocks, for the index a row write reads. */
export function extractAutomations(root: WsxElement): AutomationEntry[] {
  const out: AutomationEntry[] = []
  const walk = (node: WsxNode) => {
    if (node.kind !== 'element') return
    const { table, on, title } = node.props
    if (
      node.name === 'Automation' &&
      typeof table === 'string' &&
      (on === 'insert' || on === 'update')
    ) {
      out.push({
        table,
        event: on,
        title: typeof title === 'string' ? title : null,
        source: textOf(node),
      })
    }
    for (const child of node.children) walk(child)
  }
  walk(root)
  return out
}

/** The page's `<Formula>` functions, for the index a formula column calls through. */
export function extractFormulas(root: WsxElement): { name: string; source: string }[] {
  const out: { name: string; source: string }[] = []
  const walk = (node: WsxNode) => {
    if (node.kind !== 'element') return
    if (node.name === 'Formula' && typeof node.props.name === 'string') {
      out.push({ name: node.props.name, source: textOf(node) })
    }
    for (const child of node.children) walk(child)
  }
  walk(root)
  return out
}
