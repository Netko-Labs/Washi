/** `washi:chat:<workspace>:<page id | home>` → the chat last on screen there (D110). */
export const CHAT_KEY_PREFIX = 'washi:chat:'
export const HOME_SCOPE_KEY = 'home'

/** No word from a working turn this long and the chat says so, with Stop and Retry (D114). */
export const STALL_MS = 90_000
/** Retry over a stuck turn waits this long for Stop's receipt; the server's grace is 15s. */
export const RETRY_WAIT_MS = 20_000
