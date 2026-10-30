import { CODE_LIMITS, type PagePackageSet } from '@washi/domain'
import { TERMINAL_FRAME } from '@washi/paper/registry'
import type { Diagnostic, WsxElement, WsxNode } from '@washi/wsx'
import { bundle, failure } from './compile'
import { isAllowedImport, isNodeRequire, terminalRefusal } from './imports'
import type { BundleTarget, CompiledPage, WidgetReach } from './types'
import { KB, TERMINAL_PROGRAM_MAX_CHARS } from './values'

/** The program held unrun in its frame: `washi` there is the Terminal's screen and Node shim. */
const TERMINAL_TARGET: BundleTarget = {
  entry: `import { boot } from 'washi'\nboot(() => require('washi:self'))`,
  washi: TERMINAL_FRAME,
  react: false,
  minify: { whitespace: true, syntax: true },
  node: true,
  // The program is always the main module; Bun would otherwise read `require.main === module` false.
  define: { 'require.main': 'module' },
  selfLoader: 'js',
  refusal: terminalRefusal,
}

const transpiler = new Bun.Transpiler({ loader: 'js' })
const REQUIRE = /\brequire\(\s*(["'`])([^"'`]+)\1\s*\)/g

/** What a program requires by name — the scan reads only `import`s, so `require` is read off it. */
function requiredBy(program: string): string[] {
  const code = transpiler.transformSync(program)
  const imports = transpiler.scan(program).imports.map(({ path }) => path)
  return [...imports, ...[...code.matchAll(REQUIRE)].map((found) => found[2] ?? '')]
}

/** Why a Terminal's program would not run, in words; null when it would. */
export function terminalProblem(program: string, packages: PagePackageSet | null): string | null {
  if (program.length > TERMINAL_PROGRAM_MAX_CHARS) {
    return `a terminal's program is at most ${TERMINAL_PROGRAM_MAX_CHARS} characters`
  }
  try {
    const refused = requiredBy(program).find(
      (path) => path === 'washi' || (!isNodeRequire(path) && !isAllowedImport(path, packages)),
    )
    return refused ? terminalRefusal(refused, packages) : null
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return `code: ${message.split('\n')[0] ?? message}`
  }
}

export const programOf = (node: WsxElement) =>
  node.children.map((child) => (child.kind === 'text' ? child.value : '')).join('')

/** Every Terminal's program checked at save, as its frame would run it. */
export function terminalDiagnostics(
  root: WsxElement,
  packages: PagePackageSet | null = null,
): Diagnostic[] {
  const found: Diagnostic[] = []
  const walk = (node: WsxNode) => {
    if (node.kind !== 'element') return
    const problem = node.name === 'Terminal' ? terminalProblem(programOf(node), packages) : null
    if (problem)
      found.push({ severity: 'error', path: 'Terminal', message: `terminal: ${problem}` })
    for (const child of node.children) walk(child)
  }
  walk(root)
  return found
}

/**
 * A Terminal's program bundled for its frame (D119): Node-style JS, Node's own modules lent by
 * the frame, libraries from the vetted list and the server's page packages. It runs in a widget's
 * frame, so it reaches what a widget may (D113, D118) and nothing it could not.
 */
export async function compileTerminal(
  program: string,
  packages: PagePackageSet | null = null,
  reach: WidgetReach = { maxKb: CODE_LIMITS.widgetBundleKb, network: [] },
): Promise<CompiledPage> {
  const problem = terminalProblem(program, packages)
  if (problem) return failure(problem)
  const key = ['terminal', program]
  const compiled = await bundle(
    program,
    () => null,
    TERMINAL_TARGET,
    key,
    packages,
    reach.maxKb * KB,
  )
  return compiled.ok ? { ...compiled, network: reach.network } : compiled
}
