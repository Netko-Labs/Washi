import { describe, expect, test } from 'bun:test'
import { coverLook, parseCover, sameCover } from '../utils'

describe('covers', () => {
  test('three shapes, and a bare key from before D60 is a preset', () => {
    expect(parseCover('preset:sage')).toEqual({ kind: 'preset', key: 'sage' })
    expect(parseCover('sage')).toEqual({ kind: 'preset', key: 'sage' })
    expect(parseCover('picture:fjord')).toEqual({ kind: 'picture', key: 'fjord' })
    expect(parseCover('file:01a1')).toEqual({ kind: 'file', key: '01a1' })
  })

  test('an unknown key, kind or empty value is no cover', () => {
    expect(parseCover(null)).toBeNull()
    expect(parseCover('preset:nope')).toBeNull()
    expect(parseCover('picture:nope')).toBeNull()
    expect(parseCover('url:https://x')).toBeNull()
    expect(parseCover('file:')).toBeNull()
  })

  test('a picture names itself on the band; a preset and an upload say nothing', () => {
    expect(coverLook({ kind: 'picture', key: 'fjord' }, 'w1').caption).toBe('Fjord')
    expect(coverLook({ kind: 'preset', key: 'sage' }, 'w1').caption).toBeNull()
    expect(coverLook({ kind: 'file', key: 'f1' }, 'w1').style.backgroundImage).toBe(
      'url(/api/files/f1?workspace=w1)',
    )
    expect(sameCover('sage', 'preset', 'sage')).toBe(true)
    expect(sameCover('picture:fjord', 'preset', 'fjord')).toBe(false)
  })
})
