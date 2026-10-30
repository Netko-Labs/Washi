export const SECRET_ENV = 'WASHI_SECRET_KEY'
export const DATABASE_ENV = 'WASHI_DATABASE_URL'

/** AES-GCM standard nonce length. */
export const IV_BYTES = 12
export const KEY_BITS = 256

/** A master key shorter than this is not worth the ceremony around it. */
export const MIN_SECRET_LENGTH = 32

/** What the server's own key is sealed under — a colon no organization id carries. */
export const SERVER_SEAL_ID = ':server'
/** The server's Exa key, under its own id so the two keys never share a derivation. */
export const SERVER_SEARCH_SEAL_ID = ':server:exa'
/** The server's Unsplash Access Key, its own derivation too (D117). */
export const SERVER_UNSPLASH_SEAL_ID = ':server:unsplash'

/** `instance_setting` keys (D105); `signup` predates them. */
export const SETTING_KEYS = {
  agentKey: 'agent_key',
  searchKey: 'search_key',
  unsplashKey: 'unsplash_key',
  fetchHosts: 'fetch_hosts',
  embedHosts: 'embed_hosts',
  widgets: 'widgets',
  defaults: 'workspace_defaults',
  pagePackages: 'page_packages',
} as const

/** A fresh server lets its first account in; after that, only invited emails. */
export const DEFAULT_SIGNUP = 'invite'
export const SIGNUP_REFUSED =
  'This server is invite-only. Ask a workspace owner to invite this email, then sign up with it.'

/** Every access token starts so — a secret scanner can tell one from noise. */
export const TOKEN_PREFIX = 'washi_pat_'
export const TOKEN_BYTES = 32
/** How stale "last used" may be before a use writes it again. */
export const TOKEN_USE_GRAIN_MS = 60_000

/** Where an OAuth sign-in starts and asks for consent (studio routes). */
export const SIGN_IN_PAGE = '/sign-in'
export const CONSENT_PAGE = '/oauth/consent'
export const OAUTH_SCOPES = ['openid', 'profile', 'email', 'offline_access'] as const
