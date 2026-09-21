/**
 * The server origin. The desktop renderer gets this on its window URL; the web
 * client gets it at build time, because it is served from somewhere else
 * entirely. Same client code, different base URL — constraint C4.
 */
export const SERVER_URL = import.meta.env.VITE_WASHI_SERVER ?? 'http://localhost:3000'

export const WORKSPACE_HEADER = 'x-washi-workspace'

/** Which workspace the viewer last had open. A convenience, never a permission. */
export const ACTIVE_WORKSPACE_KEY = 'washi:active-workspace'
