import { describe, expect, test } from 'bun:test'
import { inlineMarks, inlinePlain } from '../inline-marks'

describe('a text run reads its inline marks', () => {
  test('strong, em, strike, code and a link', () => {
    expect(inlineMarks('a **b** *c* _d_ ~~e~~ `f` [g](https://x.dev/g)')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'strong', children: [{ kind: 'text', text: 'b' }] },
      { kind: 'text', text: ' ' },
      { kind: 'em', children: [{ kind: 'text', text: 'c' }] },
      { kind: 'text', text: ' ' },
      { kind: 'em', children: [{ kind: 'text', text: 'd' }] },
      { kind: 'text', text: ' ' },
      { kind: 'strike', children: [{ kind: 'text', text: 'e' }] },
      { kind: 'text', text: ' ' },
      { kind: 'code', text: 'f' },
      { kind: 'text', text: ' ' },
      { kind: 'link', href: 'https://x.dev/g', children: [{ kind: 'text', text: 'g' }] },
    ])
  })

  test('marks nest, and a code span keeps its braces and stars', () => {
    expect(inlineMarks('**see [docs](https://x.dev)**')).toEqual([
      {
        kind: 'strong',
        children: [
          { kind: 'text', text: 'see ' },
          { kind: 'link', href: 'https://x.dev', children: [{ kind: 'text', text: 'docs' }] },
        ],
      },
    ])
    expect(inlineMarks('`/m/{slug}` and `a*b*c`')).toEqual([
      { kind: 'code', text: '/m/{slug}' },
      { kind: 'text', text: ' and ' },
      { kind: 'code', text: 'a*b*c' },
    ])
    expect(inlineMarks('``a ` b``')).toEqual([{ kind: 'code', text: 'a ` b' }])
  })

  test('what does not close reads as typed', () => {
    for (const plain of [
      '2 * 3 * 4',
      'snake_case_name and other_one',
      '**unclosed',
      'a [label] here',
      'price: $5 * qty',
      '[js](javascript:alert(1))',
      '[plain](http://example.com)',
    ]) {
      expect(inlinePlain(inlineMarks(plain))).toBe(plain)
      expect(inlineMarks(plain).every((token) => token.kind === 'text')).toBe(true)
    }
  })

  test('a backslash keeps a mark literal', () => {
    expect(inlineMarks('\\*not em\\*')).toEqual([{ kind: 'text', text: '*not em*' }])
  })
})
