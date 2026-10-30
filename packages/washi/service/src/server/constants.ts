/** A host name, or `*.suffix` for every host under it — never an address. */
export const FETCH_HOST = /^(\*\.)?(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

/** npm's rules for a new package name: lowercase, URL-safe, an optional scope (D116). */
export const PACKAGE_NAME = /^(@[a-z0-9~-][a-z0-9._~-]*\/)?[a-z0-9~-][a-z0-9._~-]*$/
/** An exact version, a range or a dist-tag — never a URL, a path, git or an alias. */
export const PACKAGE_SPEC = /^[\w.^~<>=|* +-]{1,64}$/
export const PACKAGE_NAME_MAX = 214
/** Names a page already imports from Washi itself; a server package may not shadow them. */
export const BUILT_IN_IMPORTS = ['washi', 'react', 'react-dom']
