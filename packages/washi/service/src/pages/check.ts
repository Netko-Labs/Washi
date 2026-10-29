import { PAGE_IMPORT } from '@washi/paper/registry'
import { type Diagnostic, pageModule } from '@washi/wsx'
import { IMPORT_WORDS, LIBRARY, PAGE_CODE_MAX_CHARS } from './values'

const transpiler = new Bun.Transpiler({ loader: 'tsx' })

export const isAllowedImport = (path: string) =>
  path === 'washi' || path === 'washi/ui' || LIBRARY.test(path) || PAGE_IMPORT.test(path)

const problem = (message: string): Diagnostic => ({ severity: 'error', path: 'Sheet', message })

/** A page's code checked at save: it compiles, and imports only what a page may (D100). */
export function pageCodeDiagnostics(source: string): Diagnostic[] {
  if (source.length > PAGE_CODE_MAX_CHARS) {
    return [problem(`a page that runs code is at most ${PAGE_CODE_MAX_CHARS} characters`)]
  }
  try {
    const module = pageModule(source)
    const refused = transpiler
      .scan(module)
      .imports.map((each) => each.path)
      .filter((path) => !isAllowedImport(path))
    transpiler.transformSync(module)
    return refused.map((path) => problem(`cannot import "${path}" — ${IMPORT_WORDS}`))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return [problem(`code: ${message.split('\n')[0] ?? message}`)]
  }
}
