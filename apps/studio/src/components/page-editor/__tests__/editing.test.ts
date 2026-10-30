import { beforeEach, describe, expect, test } from 'bun:test'
import { parse } from '@washi/wsx'
import { newColumns } from '../lib/columns'
import { lockedBlock, newBlock, toBlocks } from '../lib/convert'
import { useEditorStore } from '../lib/editor-store'
import type { Block } from '../lib/types'
import { dataNode } from '../lib/utils'

const store = useEditorStore.getState
const textOf = (block: Block | undefined) => (block && 'text' in block ? block.text : null)
const page = () => store().blocks

function loadTitled(...rest: Block[]) {
  const title = newBlock('h1', '🚀 Launch')
  store().load([title, ...rest])
  return title
}

beforeEach(() => useEditorStore.setState({ blocks: [], focus: null }))

describe('the title stays the title', () => {
  test('Backspace at the start of the first block never joins it to the title', () => {
    const title = loadTitled(newBlock('text', 'short para'))
    const para = page()[1]
    store().mergeBack(para?.id ?? '')
    expect(page().map(textOf)).toEqual([title.text, 'short para'])
  })

  test('an empty first block goes, and the caret lands at the title’s end', () => {
    const title = loadTitled(newBlock('text', ''), newBlock('text', 'below'))
    store().mergeBack(page()[1]?.id ?? '')
    expect(page().map(textOf)).toEqual([title.text, 'below'])
    expect(store().focus).toEqual({ id: title.id, caret: 'end' })
  })

  test('Backspace at the start of the title leaves it a heading', () => {
    const title = loadTitled(newBlock('text', 'x'))
    store().mergeBack(title.id)
    expect(page()[0]?.kind).toBe('h1')
  })

  test('further down, Backspace still joins a block to the one above', () => {
    loadTitled(newBlock('text', 'one'), newBlock('text', 'two'))
    store().mergeBack(page()[2]?.id ?? '')
    expect(page().map(textOf)).toEqual(['🚀 Launch', 'onetwo'])
  })

  test('a page that opens with text, not a heading, merges as before', () => {
    store().load([newBlock('text', 'a'), newBlock('text', 'b')])
    store().mergeBack(page()[1]?.id ?? '')
    expect(page().map(textOf)).toEqual(['ab'])
  })
})

describe('duplicate', () => {
  test('a text block is copied right below under a new id, the caret in the copy', () => {
    loadTitled(newBlock('todo', 'pack'), newBlock('text', 'after'))
    const todo = page()[1]
    store().duplicate(todo?.id ?? '')
    const [, first, copy, after] = page()
    expect([first, copy, after].map(textOf)).toEqual(['pack', 'pack', 'after'])
    expect(copy?.kind).toBe('todo')
    expect(copy?.id).not.toBe(first?.id)
    expect(store().focus).toEqual({ id: copy?.id ?? '', caret: 'end' })
  })

  test('a locked block or a row of columns copies whole, every id new', () => {
    const node = dataNode({ kind: 'view', table: 'issues' })
    const view = lockedBlock(node)
    const columns = newColumns(2)
    loadTitled(view, columns)
    store().duplicate(view.id)
    store().duplicate(columns.id)
    const blocks = page()
    expect(blocks.map((block) => block.kind)).toEqual([
      'h1',
      'locked',
      'locked',
      'columns',
      'columns',
    ])
    const [, , viewCopy, , rowCopy] = blocks
    expect(viewCopy?.kind === 'locked' && viewCopy.node).toEqual(node)
    const ids = (block: Block | undefined) =>
      block?.kind === 'columns'
        ? [block.id, ...block.columns.flatMap((c) => [c.id, ...c.blocks.map((b) => b.id)])]
        : []
    const shared = ids(rowCopy).filter((id) => ids(columns).includes(id))
    expect(shared).toEqual([])
  })

  test('a block in a column is copied within its column', () => {
    const [title] = toBlocks(parse('<Sheet title="t"><Title>t</Title></Sheet>'))
    const columns = newColumns(2)
    store().load([title as Block, columns])
    const cell = columns.columns[0]?.blocks[0]
    store().duplicate(cell?.id ?? '')
    const row = page()[1]
    expect(row?.kind === 'columns' && row.columns.map((c) => c.blocks.length)).toEqual([2, 1])
  })
})

describe('/ columns land in place', () => {
  test('a Columns block, the caret in its first column', async () => {
    loadTitled(newBlock('text', '/2 columns'))
    const slash = page()[1]
    await store().insertData(slash?.id ?? '', { kind: 'columns', count: 2 })
    const [, row, after] = page()
    expect(row?.kind).toBe('columns')
    expect(after?.kind).toBe('text')
    const first = row?.kind === 'columns' ? row.columns[0]?.blocks[0]?.id : undefined
    expect(store().focus).toEqual({ id: first ?? '', caret: 0 })
  })
})
