/** Loopback only in embedded mode — the local server is never a network service. */
export const EMBEDDED_HOSTNAME = '127.0.0.1'
export const DEFAULT_HOSTED_PORT = 3000

/** Phase 1 has one workspace per deployment; phase 2's control plane replaces this. */
export const DEFAULT_WORKSPACE_ID = 'default'

/** Mirrors the control plane's own floor; asserted before anything listens. */
export const MIN_SECRET_LENGTH = 32
