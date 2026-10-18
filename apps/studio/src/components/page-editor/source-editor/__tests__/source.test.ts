import { describe, expect, test } from 'bun:test'
import { Text } from '@codemirror/state'
import { checkSource, isSavable, toLint } from '../lib/utils'

const VALID = '<Sheet title="Kyoto" wsx="1">\n  <Text>Hi</Text>\n</Sheet>'

describe('source mode', () => {
  test('a valid page has nothing blocking its save', () => {
    expect(isSavable(checkSource(VALID))).toBe(true)
  })

  test('a handler is refused, as the server refuses it', () => {
    const diagnostics = checkSource('<Sheet title="x" wsx="1" onClick={() => 1} />')
    expect(isSavable(diagnostics)).toBe(false)
  })

  test('an unknown primitive is a schema error with a path, not a line', () => {
    const diagnostics = checkSource('<Sheet title="x" wsx="1"><Div /></Sheet>')
    expect(isSavable(diagnostics)).toBe(false)
    expect(toLint(Text.of(['<Sheet title="x" wsx="1"><Div /></Sheet>']), diagnostics)).toEqual([])
  })

  test('a parse error underlines its line', () => {
    const source = '<Sheet title="x" wsx="1">\n  <Text>\n</Sheet>'
    const lint = toLint(Text.of(source.split('\n')), checkSource(source))
    expect(lint.length).toBeGreaterThan(0)
    expect(lint[0]?.severity).toBe('error')
  })
})
