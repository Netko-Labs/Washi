import { describe, expect, test } from 'bun:test'
import { pillStateFor, WASHI_LINGER_MS } from '../lib'

const NOW = 1_800_000_000_000
const stamp = (ms: number) => `${ms.toString().padStart(14, '0')}-0000-server`
const washiWrote = (msAgo: number) => ({
  editedBy: 'washi' as const,
  hlcUpdated: stamp(NOW - msAgo),
})

describe('pillStateFor', () => {
  test('a page nobody is working on shows nothing, however long ago Washi wrote it', () => {
    expect(pillStateFor({ mood: 'idle', isBusy: false, sheet: washiWrote(3_600_000), now: NOW })).toBe(
      null,
    )
    expect(
      pillStateFor({
        mood: 'done',
        isBusy: false,
        sheet: { editedBy: null, hlcUpdated: stamp(NOW) },
        now: NOW,
      }),
    ).toBe(null)
    expect(pillStateFor({ mood: 'idle', isBusy: false, sheet: undefined, now: NOW })).toBe(null)
  })

  test('a turn at work shows its mood', () => {
    expect(pillStateFor({ mood: 'reading', isBusy: true, sheet: undefined, now: NOW })).toBe(
      'reading',
    )
  })

  test('Washi lingers on a page for a while after it writes it', () => {
    const fresh = washiWrote(WASHI_LINGER_MS - 1)
    expect(pillStateFor({ mood: 'done', isBusy: false, sheet: fresh, now: NOW })).toBe('done')
    expect(pillStateFor({ mood: 'idle', isBusy: false, sheet: fresh, now: NOW })).toBe('writing')
    const stale = washiWrote(WASHI_LINGER_MS)
    expect(pillStateFor({ mood: 'done', isBusy: false, sheet: stale, now: NOW })).toBe(null)
  })
})
