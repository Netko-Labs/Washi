import { describe, expect, test } from 'bun:test'
import { applyEdits, SheetEditError } from '../edit'

describe('applyEdits (D122)', () => {
  test('an old that occurs once is replaced', () => {
    expect(applyEdits('<Text>one</Text>', [{ old: 'one', new: 'two' }])).toBe('<Text>two</Text>')
  })

  test('overlapping occurrences count, so the edit refuses', () => {
    expect(() => applyEdits('aaa', [{ old: 'aa', new: 'b' }])).toThrow(/2 times/)
    expect(() => applyEdits('ababa', [{ old: 'aba', new: 'x' }])).toThrow(SheetEditError)
  })

  test('a miss changes nothing', () => {
    expect(() => applyEdits('abc', [{ old: 'z', new: 'y' }])).toThrow(/nowhere/)
  })
})
