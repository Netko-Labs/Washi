export const RUNTIME = Symbol.for('washi.studio.runtime')

/** How long a stopping server keeps answering: the proxy routes here until the container exits. */
export const SERVE_THROUGH_SHUTDOWN_MS = 4_000
