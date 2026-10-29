import { describe, expect, test } from 'bun:test'
import { paperRegistry } from '@washi/paper/registry'
import { parse, serialize, validate } from '@washi/wsx'
import { moveBlock, resizeColumns } from '../lib/columns'
import { newBlock, toBlocks, toSheet } from '../lib/convert'
import { flatten, isColumns, tidy } from '../lib/slots'
import type { Block, ColumnsBlock } from '../lib/types'

const SOURCE = `<Sheet title="Hub" wsx="1">
  <Title>Finances</Title>
  <Columns>
    <Column><Text>Budget</Text><List marker="bullet"><Item>rent</Item><Item>food</Item></List></Column>
    <Column ratio={2}><Text>Notes</Text></Column>
  </Columns>
</Sheet>`

const textOf = (block: Block | undefined) => (block && 'text' in block ? block.text : null)
const row = (blocks: Block[]) => blocks.find(isColumns) as ColumnsBlock

describe('columns in the editor', () => {
  test('a row of columns edits in place and saves back the same page', () => {
    const blocks = toBlocks(parse(SOURCE))
    const columns = row(blocks)
    expect(columns.columns.map((column) => column.ratio)).toEqual([1, 2])
    expect(columns.columns[0]?.blocks.map(textOf)).toEqual(['Budget', 'rent', 'food'])
    const saved = toSheet(parse(SOURCE), blocks)
    expect(validate(saved, paperRegistry)).toEqual([])
    expect(serialize(saved)).toBe(serialize(parse(SOURCE)))
  })

  test('a block dropped beside another makes two columns; dropped beside a column, a third', () => {
    const [a, b, c] = [newBlock('text', 'a'), newBlock('text', 'b'), newBlock('text', 'c')]
    const two = moveBlock([a, b, c], b.id, a.id, 'right')
    expect(two).toHaveLength(2)
    expect(row(two).columns.map((column) => column.blocks.map(textOf))).toEqual([['a'], ['b']])
    const three = moveBlock(two, c.id, b.id, 'right')
    expect(row(three).columns.map((column) => column.blocks.map(textOf))).toEqual([
      ['a'],
      ['b'],
      ['c'],
    ])
    expect(flatten(three).map(textOf)).toEqual(['a', 'b', 'c'])
  })

  test('a column emptied goes, and the last one unwraps into the page', () => {
    const [a, b] = [newBlock('text', 'a'), newBlock('text', 'b')]
    const two = moveBlock([a, b], b.id, a.id, 'left')
    const back = moveBlock(two, b.id, a.id, 'after')
    expect(back.map(textOf)).toEqual(['a', 'b'])
    expect(back.some(isColumns)).toBe(false)
    expect(tidy([{ ...row(two), columns: [] }])).toEqual([])
  })

  test('rows of columns never nest', () => {
    const [a, b, c] = [newBlock('text', 'a'), newBlock('text', 'b'), newBlock('text', 'c')]
    const two = moveBlock([a, b, c], b.id, a.id, 'right')
    const inner = row(two)
    const other = moveBlock([...two], c.id, inner.columns[0]?.blocks[0]?.id ?? '', 'after')
    expect(moveBlock(other, inner.id, c.id, 'left')).toBe(other)
  })

  test('the gap moves shares in sixths, reduced again after', () => {
    const [a, b] = [newBlock('text', 'a'), newBlock('text', 'b')]
    const two = moveBlock([a, b], b.id, a.id, 'right')
    const id = row(two).id
    expect(row(resizeColumns(two, id, 0, 0.66)).columns.map((c) => c.ratio)).toEqual([2, 1])
    expect(row(resizeColumns(two, id, 0, 0.17)).columns.map((c) => c.ratio)).toEqual([1, 5])
    expect(row(resizeColumns(two, id, 0, 0.5)).columns.map((c) => c.ratio)).toEqual([1, 1])
  })
})
