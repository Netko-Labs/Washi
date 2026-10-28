import type { AutomationEntry } from '@washi/repository'
import type { Diagnostic, WsxElement, WsxNode } from '@washi/wsx'
import type { CompiledScript, FoundScript, ScriptEntry } from './types'
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
export function compileScript(source: string, entry: ScriptEntry = 'view'): CompiledScript {
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
    if (!names.test(js)) return { ok: false, error: ENTRY_WORDS[entry] }
    return { ok: true, js }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: message.split('\n')[0] ?? message }
  }
}

function scripts(node: WsxNode, path: string, out: FoundScript[]) {
  if (node.kind !== 'element') return
  const here = path ? `${path} > ${node.name}` : node.name
  const entry = ENTRIES[node.name]
  if (entry) out.push({ path: here, entry, source: textOf(node) })
  for (const child of node.children) scripts(child, here, out)
}

/** A widget is a block's worth of HTML; a page that carries more is refused at save. */
export const WIDGET_MAX_CHARS = 50_000

function widgetDiagnostics(node: WsxNode, path: string): Diagnostic[] {
  if (node.kind !== 'element') return []
  const here = path ? `${path} > ${node.name}` : node.name
  const own =
    node.name === 'Widget' &&
    node.children.reduce(
      (sum, child) => sum + (child.kind === 'text' ? child.value.length : 0),
      0,
    ) > WIDGET_MAX_CHARS
      ? [
          {
            severity: 'error' as const,
            path: here,
            message: `widget: at most ${WIDGET_MAX_CHARS} characters`,
          },
        ]
      : []
  return [...own, ...node.children.flatMap((child) => widgetDiagnostics(child, here))]
}

export const textOf = (node: WsxElement) =>
  node.children.map((child) => (child.kind === 'text' ? child.value : '')).join('')

/** Every script on the page compiled now, so one that cannot run is refused before it is saved. */
export function scriptDiagnostics(root: WsxElement): Diagnostic[] {
  const found: FoundScript[] = []
  scripts(root, '', found)
  const scripted = found.flatMap(({ path, source, entry }) => {
    const compiled = compileScript(source, entry)
    return compiled.ok
      ? []
      : [{ severity: 'error' as const, path, message: `script: ${compiled.error}` }]
  })
  return [...widgetDiagnostics(root, ''), ...scripted]
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
