import { describe, expect, test } from 'bun:test'
import { continueUrl } from '../continue'

describe('where a sign-in or consent goes next (D101)', () => {
  test('follows the address Better Auth gives an agent’s request', () => {
    expect(continueUrl({ url: 'http://127.0.0.1:53999/callback?code=x', redirect: true })).toBe(
      'http://127.0.0.1:53999/callback?code=x',
    )
    expect(continueUrl({ uri: '/oauth/consent?client_id=a' })).toBe('/oauth/consent?client_id=a')
  })

  test('an ordinary sign-in, or an address that is no web page, goes nowhere', () => {
    expect(continueUrl({ user: { id: 'u' }, token: 't' })).toBeNull()
    expect(continueUrl({ url: 'javascript:alert(1)' })).toBeNull()
    expect(continueUrl({ url: '//evil.example/callback' })).toBeNull()
    expect(continueUrl(null)).toBeNull()
  })
})
