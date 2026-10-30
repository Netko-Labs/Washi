import type { PagePackageSet } from '@washi/domain'
import { type Diagnostic, hoistedHookCalls, pageModule } from '@washi/wsx'
import { importRefusal, isAllowedImport } from './imports'
import { PAGE_CODE_MAX_CHARS } from './values'

const transpiler = new Bun.Transpiler({ loader: 'tsx' })

const problem = (message: string): Diagnostic => ({ severity: 'error', path: 'Sheet', message })

/**
 * A page's code checked at save: it compiles, and imports only what a page may (D100) — on a
 * server, its page packages too (D116).
 */
export function pageCodeDiagnostics(
  source: string,
  packages: PagePackageSet | null = null,
): Diagnostic[] {
  if (source.length > PAGE_CODE_MAX_CHARS) {
    return [problem(`a page that runs code is at most ${PAGE_CODE_MAX_CHARS} characters`)]
  }
  try {
    const module = pageModule(source)
    const refused = transpiler
      .scan(module)
      .imports.map((each) => each.path)
      .filter((path) => !isAllowedImport(path, packages))
    transpiler.transformSync(module)
    const hooks = hoistedHookCalls(source).map((hook) =>
      problem(
        `an export calls ${hook}() as the page loads, not as it draws — export a function that calls it (export function useTotals() { … })`,
      ),
    )
    return [...refused.map((path) => problem(importRefusal(path, packages))), ...hooks]
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return [problem(`code: ${message.split('\n')[0] ?? message}`)]
  }
}
