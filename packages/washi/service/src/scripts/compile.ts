import type { Diagnostic, WsxElement, WsxNode } from '@washi/wsx'
import type { CompiledScript, FoundScript } from './types'

/** A script is one page block's worth of TSX, not a program. */
export const SCRIPT_MAX_CHARS = 20_000

const transpiler = new Bun.Transpiler({
  loader: 'tsx',
  tsconfig: { compilerOptions: { jsx: 'react', jsxFactory: 'h', jsxFragmentFactory: 'Fragment' } },
})

/**
 * TSX in, plain JS out, the JSX as `h(Card, …)` calls the sandbox answers. A script imports and
 * exports nothing — everything it may touch arrives as the sandbox's hooks — and names a `view`.
 */
export function compileScript(source: string): CompiledScript {
  if (source.length > SCRIPT_MAX_CHARS) {
    return { ok: false, error: `a script is at most ${SCRIPT_MAX_CHARS} characters` }
  }
  try {
    const { imports, exports } = transpiler.scan(source)
    if (imports.length > 0)
      return { ok: false, error: 'a script imports nothing — its hooks are already there' }
    if (exports.length > 0)
      return { ok: false, error: 'a script exports nothing — name a function view' }
    const js = transpiler.transformSync(source)
    if (!/\bfunction\s+view\s*\(|\b(?:const|let|var)\s+view\s*=/.test(js)) {
      return { ok: false, error: 'a script needs a function view() that returns what it draws' }
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
  if (node.name === 'Script') {
    out.push({
      path: here,
      source: node.children.map((child) => (child.kind === 'text' ? child.value : '')).join(''),
    })
  }
  for (const child of node.children) scripts(child, here, out)
}

/** Every script on the page compiled now, so one that cannot run is refused before it is saved. */
export function scriptDiagnostics(root: WsxElement): Diagnostic[] {
  const found: FoundScript[] = []
  scripts(root, '', found)
  return found.flatMap(({ path, source }) => {
    const compiled = compileScript(source)
    return compiled.ok
      ? []
      : [{ severity: 'error' as const, path, message: `script: ${compiled.error}` }]
  })
}
