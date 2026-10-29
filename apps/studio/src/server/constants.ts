export const RUNTIME = Symbol.for('washi.studio.runtime')

/** How long a stopping server keeps answering: past the proxy's health check, inside Coolify's 30s grace. */
export const SERVE_THROUGH_SHUTDOWN_MS = 15_000
