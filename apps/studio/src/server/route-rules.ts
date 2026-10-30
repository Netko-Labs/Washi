import { FILE_CSP, FILE_ROUTES, HSTS_HEADER, SECURITY_HEADERS } from './constants'
import type { HeaderRules } from './types'

/**
 * Nitro's `headers` rule is set on the final response, over whatever a handler set, and a more
 * specific pattern's values win: so an upload's `sandbox` has to be a rule of its own.
 */
export function securityRouteRules(isBuild: boolean): HeaderRules {
  const headers = isBuild ? { ...SECURITY_HEADERS, ...HSTS_HEADER } : SECURITY_HEADERS
  const fileRule = { headers: { 'content-security-policy': FILE_CSP } }
  return {
    '/**': { headers },
    ...Object.fromEntries(FILE_ROUTES.map((route) => [route, fileRule] as const)),
  }
}
