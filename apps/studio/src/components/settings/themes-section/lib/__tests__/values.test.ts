import { describe, expect, test } from 'bun:test'
import { paperRegistry } from '@washi/paper/registry'
import { parse, validate } from '@washi/wsx'
import { PREVIEW_SOURCE } from '../values'

describe('the theme preview', () => {
  test('is a page the registry accepts, wearing the key the editor lends', () => {
    const root = parse(PREVIEW_SOURCE)
    expect(validate(root, paperRegistry)).toEqual([])
    expect(root.props.theme).toBe('ws:preview')
  })
})
