import { describe, expect, test } from 'bun:test'
import { checkUrl, fetchPolicySchema, isPrivateAddress } from '../index'

const policy = fetchPolicySchema.parse({ allowedHosts: ['api.example.com', '*.github.com'] })

describe('private address detection', () => {
  test('blocks loopback, rfc1918, link-local, mapped v6, mdns', () => {
    for (const host of [
      'localhost',
      'washi.localhost',
      '127.0.0.1',
      '127.9.9.9',
      '10.0.0.5',
      '172.16.0.1',
      '172.31.255.1',
      '192.168.1.1',
      '169.254.169.254',
      '0.0.0.0',
      '::1',
      'fd00::1',
      'fe80::1',
      '::ffff:10.0.0.1',
      'printer.local',
    ]) {
      expect(isPrivateAddress(host)).toBe(true)
    }
  })

  test('allows public addresses', () => {
    for (const host of ['api.example.com', '8.8.8.8', '172.32.0.1', '2606:4700::1111']) {
      expect(isPrivateAddress(host)).toBe(false)
    }
  })
})

describe('url policy', () => {
  test('https only, no creds, no odd ports', () => {
    expect(checkUrl('http://api.example.com/x', policy)).toMatchObject({ ok: false, reason: 'https only' })
    expect(checkUrl('https://user:pw@api.example.com/x', policy)).toMatchObject({ ok: false })
    expect(checkUrl('https://api.example.com:8443/x', policy)).toMatchObject({ ok: false })
    expect(checkUrl('ftp://api.example.com', policy)).toMatchObject({ ok: false })
    expect(checkUrl('not a url', policy)).toMatchObject({ ok: false, reason: 'invalid URL' })
  })

  test('private ranges rejected even when allowlisted', () => {
    const evil = fetchPolicySchema.parse({ allowedHosts: ['192.168.1.10', 'localhost'] })
    expect(checkUrl('https://192.168.1.10/steal', evil)).toMatchObject({ ok: false })
    expect(checkUrl('https://localhost/mcp', evil)).toMatchObject({ ok: false })
  })

  test('allowlist: exact match, wildcard suffix, approval flag for strangers', () => {
    expect(checkUrl('https://api.example.com/data', policy).ok).toBe(true)
    expect(checkUrl('https://raw.github.com/x', policy).ok).toBe(true)
    const stranger = checkUrl('https://unknown.dev/x', policy)
    expect(stranger).toMatchObject({ ok: false, needsApproval: true })
  })
})
