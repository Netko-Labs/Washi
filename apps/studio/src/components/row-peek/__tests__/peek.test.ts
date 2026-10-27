import { describe, expect, test } from 'bun:test'
import { peekOf, withPeek } from '../lib/utils'

describe('peek address', () => {
  test('sets the peek beside the search already there', () => {
    expect(withPeek({ pathname: '/w/a/p/b', searchStr: '?tab=setup' }, 'row-1')).toBe(
      '/w/a/p/b?tab=setup&peek=row-1',
    )
  })

  test('swaps one peek for another', () => {
    expect(withPeek({ pathname: '/w/a', searchStr: '?peek=row-1' }, 'row-2')).toBe(
      '/w/a?peek=row-2',
    )
  })

  test('closing leaves a bare path', () => {
    expect(withPeek({ pathname: '/w/a', searchStr: '?peek=row-1' }, null)).toBe('/w/a')
  })

  test('reads the peeked page, or none', () => {
    expect(peekOf('?peek=0199-abc')).toBe('0199-abc')
    expect(peekOf('?tab=models')).toBeNull()
  })
})
