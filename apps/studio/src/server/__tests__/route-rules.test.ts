import { describe, expect, test } from 'bun:test'
import { FILE_CSP, SECURITY_HEADERS } from '../constants'
import { securityRouteRules } from '../route-rules'

describe('the headers every answer carries', () => {
  test('an upload’s bytes are sandboxed, still never framed', () => {
    const rules = securityRouteRules(true)
    expect(FILE_CSP).toBe("sandbox; frame-ancestors 'none'")
    expect(rules['/api/files/**']?.headers['content-security-policy']).toBe(FILE_CSP)
    expect(rules['/api/share/**']?.headers['content-security-policy']).toBe(FILE_CSP)
  })

  test('the rest of the app keeps the house headers; HSTS only once built', () => {
    expect(securityRouteRules(true)['/**']?.headers).toMatchObject({
      ...SECURITY_HEADERS,
      'strict-transport-security': expect.stringContaining('max-age='),
    })
    expect(securityRouteRules(false)['/**']?.headers).toEqual(SECURITY_HEADERS)
  })
})
