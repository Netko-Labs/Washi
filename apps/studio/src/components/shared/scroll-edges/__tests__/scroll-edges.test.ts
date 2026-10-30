import { describe, expect, test } from 'bun:test'
import { edgeFade, edgesOf } from '../utils'

describe('scroll edges', () => {
  test('a strip that fits hides nothing', () => {
    expect(edgesOf({ scrollLeft: 0, clientWidth: 320, scrollWidth: 320 })).toEqual({
      start: false,
      end: false,
    })
    expect(edgeFade({ start: false, end: false })).toBe('')
  })

  test('a strip scrolled to its start hides only its end', () => {
    const edges = edgesOf({ scrollLeft: 0, clientWidth: 320, scrollWidth: 520 })
    expect(edges).toEqual({ start: false, end: true })
    expect(edgeFade(edges)).toContain('to_left')
  })

  test('mid-scroll fades both ends; at the end, only the start', () => {
    expect(edgesOf({ scrollLeft: 100, clientWidth: 320, scrollWidth: 520 })).toEqual({
      start: true,
      end: true,
    })
    expect(edgesOf({ scrollLeft: 199.5, clientWidth: 320, scrollWidth: 520 })).toEqual({
      start: true,
      end: false,
    })
  })
})
