import { PAGE_LIBRARIES } from '@washi/paper/registry'

/** A page's whole source when it runs code — a page, not a program. */
export const PAGE_CODE_MAX_CHARS = 60_000
/** What a page may ship to the reader's sandbox, its libraries bundled in. */
export const PAGE_JS_MAX_BYTES = 768 * 1024
export const PAGE_CACHE_SIZE = 64
/** How deep `page:` imports may chain before a loop is assumed. */
export const PAGE_IMPORT_DEPTH = 8

export const IMPORT_WORDS = `a page imports from washi, washi/ui, ${PAGE_LIBRARIES.join(', ')} or page:<id>`

export const LIBRARY = new RegExp(`^(${PAGE_LIBRARIES.join('|')})(/[\\w./-]+)?$`)
