import { describe, expect, test } from 'bun:test'
import { visitorAddress, visitorHash } from '../visitor'

const headers = (pairs: Record<string, string>) => new Headers(pairs)

describe('whose address a suggestion counts against (D120)', () => {
  test('Cloudflare’s own header wins over anything forwarded', () => {
    const seen = headers({ 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '1.1.1.1' })
    expect(visitorAddress(seen, '10.0.0.2')).toBe('203.0.113.7')
  })

  test('else the hop our proxy appended, never the one the client wrote', () => {
    const forged = headers({ 'x-forwarded-for': '6.6.6.6, 198.51.100.4' })
    expect(visitorAddress(forged, '10.0.0.2')).toBe('198.51.100.4')
  })

  test('else the socket peer, else nothing', () => {
    expect(visitorAddress(headers({}), '10.0.0.2')).toBe('10.0.0.2')
    expect(visitorAddress(headers({ 'x-forwarded-for': ' , ' }), null)).toBeNull()
  })

  test('no secret, no hash: the address is never kept unkeyed', () => {
    const request = new Request('https://washi.test/', {
      headers: { 'cf-connecting-ip': '1.2.3.4' },
    })
    expect(visitorHash(request, 'ws', '')).toBeNull()
    const keyed = visitorHash(request, 'ws', 'secret')
    expect(keyed).toHaveLength(64)
    expect(visitorHash(request, 'ws', 'other')).not.toBe(keyed)
  })
})
