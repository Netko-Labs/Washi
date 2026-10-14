import { describe, expect, test } from 'bun:test'
import { parse, serialize } from '@washi/wsx'
import { applyShortcut, newBlock, toBlocks, toSheet } from '../lib/utils'

const SOURCE = `<Sheet title="Plan" feel="note">
  <Title>Plan</Title>
  <Text lead>Why we are doing this</Text>
  <List marker="check">
    <Item done>Book flights</Item>
    <Item>Pack</Item>
  </List>
  <Code lang="ts">{"const a = 1\\nconst b = 2"}</Code>
  <Stat label="Budget" value="¥120k" />
  <Divider />
</Sheet>`

describe('page editor blocks', () => {
  test('text-like blocks open for typing; the rest stays whole', () => {
    const kinds = toBlocks(parse(SOURCE)).map((block) => block.kind)
    expect(kinds).toEqual(['h1', 'text', 'todo', 'todo', 'code', 'locked', 'divider'])
  })

  test('an untouched page comes back exactly as it was', () => {
    const root = parse(SOURCE)
    expect(parse(serialize(toSheet(root, toBlocks(root))))).toEqual(root)
  })

  test('list items regroup by kind, empty text is dropped, typed text is escaped', () => {
    const root = parse('<Sheet title="t"></Sheet>')
    const sheet = toSheet(root, [
      newBlock('bullet', 'one'),
      newBlock('bullet', 'two'),
      newBlock('text', ''),
      newBlock('number', 'first'),
      newBlock('text', 'a < b {c}'),
    ])
    expect(sheet.children.map((node) => (node.kind === 'element' ? node.name : 'text'))).toEqual([
      'List',
      'List',
      'Text',
    ])
    expect(parse(serialize(sheet))).toEqual(sheet)
  })

  test('text in several runs stays locked rather than gaining or losing spaces', () => {
    const root = parse('<Sheet title="t"><Text>Tom {"&"} Jerry</Text></Sheet>')
    expect(toBlocks(root).map((block) => block.kind)).toEqual(['locked'])
    expect(parse(serialize(toSheet(root, toBlocks(root))))).toEqual(root)
  })

  test('markdown shortcuts turn a text block into its kind', () => {
    expect(applyShortcut(newBlock('text', '## Goals'))).toMatchObject({ kind: 'h2', text: 'Goals' })
    expect(applyShortcut(newBlock('text', '[] milk'))).toMatchObject({ kind: 'todo', text: 'milk' })
    expect(applyShortcut(newBlock('text', '---'))).toMatchObject({ kind: 'divider' })
    expect(applyShortcut(newBlock('h1', '# not again'))).toBeNull()
  })
})
