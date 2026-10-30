import { PAGE_LIBRARIES } from '@washi/paper/registry'

/** A page's whole source when it runs code — a page, not a program. */
export const PAGE_CODE_MAX_CHARS = 60_000
/** What a page may ship to the reader's sandbox, its libraries bundled in. */
export const PAGE_JS_MAX_BYTES = 768 * 1024
export const PAGE_CACHE_SIZE = 64
/** How deep `page:` imports may chain before a loop is assumed. */
export const PAGE_IMPORT_DEPTH = 8

/** A library or a subpath of it; no segment may start with a dot, so none climbs out (`..`). */
export const LIBRARY = new RegExp(`^(${PAGE_LIBRARIES.join('|')})(/[\\w-][\\w.-]*)*$`)

export const NOT_LISTED_WORDS =
  "is not on this server's page packages — an admin can add it in Settings → Server"

/** Page code runs in a browser-like sandbox: a package's entry is read in this order (D116). */
export const BROWSER_CONDITIONS = ['browser', 'import', 'module', 'default']
