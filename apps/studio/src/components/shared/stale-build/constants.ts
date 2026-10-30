/** When the last stale-build reload ran, in ms — a second miss inside the window shows a notice. */
export const STALE_RELOAD_KEY = 'washi:stale-reload'
export const STALE_RELOAD_WINDOW_MS = 30_000

/** How Chrome, Firefox and Safari say a chunk is gone, and Vite that its CSS is. */
export const STALE_CHUNK_MESSAGES = [
  'Failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'Importing a module script failed',
  'Unable to preload CSS',
]
