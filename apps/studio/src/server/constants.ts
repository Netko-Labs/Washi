export const RUNTIME = Symbol.for('washi.studio.runtime')

/** How long a stopping server keeps answering: the proxy routes here until the container exits. */
export const SERVE_THROUGH_SHUTDOWN_MS = 4_000

export const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'content-security-policy': "frame-ancestors 'none'",
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
}

/** An upload's bytes: nothing in them runs, even opened on their own. */
export const FILE_CSP = "sandbox; frame-ancestors 'none'"

/** Every route that hands out an upload's bytes. */
export const FILE_ROUTES = ['/api/files/**', '/api/share/**']

// Built servers only: HSTS on a dev https *.localhost would pin every local project for a year.
export const HSTS_HEADER = { 'strict-transport-security': 'max-age=31536000; includeSubDomains' }
