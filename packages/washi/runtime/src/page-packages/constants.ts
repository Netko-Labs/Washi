/** Under the data dir, so a redeploy keeps every install (D116). */
export const PAGE_PACKAGES_DIR = 'page-packages'
export const NPM_REGISTRY = 'https://registry.npmjs.org'
export const REGISTRY_TIMEOUT_MS = 15_000
export const INSTALL_TIMEOUT_MS = 120_000
/** Only what bun needs to install: none of the server's own secrets reach the child. */
export const INSTALL_ENV_KEYS = ['PATH', 'HOME', 'TMPDIR', 'BUN_INSTALL', 'BUN_INSTALL_CACHE_DIR']
/** What a resolve may hand bun: a plain semver, whatever the registry's tags or keys say. */
export const EXACT_VERSION =
  /^\d{1,9}\.\d{1,9}\.\d{1,9}(-[0-9A-Za-z.-]{1,40})?(\+[0-9A-Za-z.-]{1,40})?$/
