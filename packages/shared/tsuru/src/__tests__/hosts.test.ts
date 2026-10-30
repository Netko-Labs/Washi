import { describe, expect, test } from 'bun:test'
import { checkUrl, fetchPolicySchema, hostEntry, hostMatches } from '../index'

describe('host list entries (D118)', () => {
  test('a host, *.domain or a bare * — an address is read down to its host', () => {
    expect(hostEntry('*')).toBe('*')
    expect(hostEntry(' *.Example.com ')).toBe('*.example.com')
    expect(hostEntry('https://api.example.com/v1?x=1')).toBe('api.example.com')
    expect(hostEntry('wss://live.example.com')).toBe('live.example.com')
  })

  test('anything else is refused', () => {
    for (const raw of ['*example.com', '**', '*.', 'a.*.com', 'example', '10.0.0.1', '[::1]', '']) {
      expect(hostEntry(raw)).toBeNull()
    }
  })

  test('*.domain matches the domain and its subdomains on a dot boundary', () => {
    const list = ['*.example.com']
    expect(hostMatches('example.com', list)).toBe(true)
    expect(hostMatches('a.example.com', list)).toBe(true)
    expect(hostMatches('a.b.example.com', list)).toBe(true)
    expect(hostMatches('badexample.com', list)).toBe(false)
    expect(hostMatches('example.com.evil.dev', list)).toBe(false)
  })

  test('* matches every host; an exact entry only itself', () => {
    expect(hostMatches('anything.dev', ['*'])).toBe(true)
    expect(hostMatches('api.example.com', ['api.example.com'])).toBe(true)
    expect(hostMatches('www.api.example.com', ['api.example.com'])).toBe(false)
  })
})

describe('fetch policy with the guards lifted (D118)', () => {
  test('* lets any public https host through, never http or a private one', () => {
    const all = fetchPolicySchema.parse({ allowedHosts: ['*'] })
    expect(checkUrl('https://anything.dev/x', all).ok).toBe(true)
    expect(checkUrl('http://anything.dev/x', all)).toMatchObject({ ok: false })
    expect(checkUrl('https://169.254.169.254/latest', all)).toEqual({
      ok: false,
      reason: 'private and loopback addresses are blocked',
    })
  })

  test('the private switch lets a private host ask; * alone never waves it through', () => {
    const open = fetchPolicySchema.parse({ allowedHosts: ['*'], allowPrivate: true })
    expect(checkUrl('https://10.0.0.5/x', open)).toMatchObject({ ok: false, needsApproval: true })
    const named = fetchPolicySchema.parse({ allowedHosts: ['*.local'], allowPrivate: true })
    expect(checkUrl('https://nas.local/x', named).ok).toBe(true)
  })

  test('off by default', () => {
    expect(fetchPolicySchema.parse({}).allowPrivate).toBe(false)
    const listed = fetchPolicySchema.parse({ allowedHosts: ['*.local'] })
    expect(checkUrl('https://nas.local/x', listed)).toMatchObject({ ok: false })
  })
})
