import { describe, expect, test } from 'bun:test'
import type { SheetSummary } from '@washi/domain'
import { ancestorsOf, applyPlacement, childrenOf, placementFor } from '../utils'

const page = (id: string, parentId: string | null, position: string): SheetSummary => ({
  id,
  title: id,
  icon: null,
  tags: [],
  parentId,
  position,
  cover: null,
  fullWidth: false,
  editedBy: null,
  undoable: false,
  rowOf: null,
  visibility: 'shared',
  access: [],
  hlcUpdated: '0',
})

const sheets = [
  page('projects', null, 'a'),
  page('alpha', 'projects', 'a'),
  page('deep', 'alpha', 'a'),
  page('beta', 'projects', 'b'),
  page('inbox', null, 'b'),
]

const titles = (list: SheetSummary[]) => list.map((sheet) => sheet.id)

describe('page tree', () => {
  test('children come in position order', () => {
    expect(titles(childrenOf(sheets, null))).toEqual(['projects', 'inbox'])
    expect(titles(childrenOf(sheets, 'projects'))).toEqual(['alpha', 'beta'])
  })

  test('ancestors run from the top level down', () => {
    expect(titles(ancestorsOf(sheets, 'deep'))).toEqual(['projects', 'alpha'])
    expect(ancestorsOf(sheets, 'inbox')).toEqual([])
  })

  test('a drop never lands a page inside itself', () => {
    expect(placementFor(sheets, 'projects', 'deep', 'inside')).toBeNull()
    expect(placementFor(sheets, 'projects', 'deep', 'after')).toBeNull()
    expect(placementFor(sheets, 'alpha', 'alpha', 'before')).toBeNull()
  })

  test('before, after and inside place the page where the line was drawn', () => {
    expect(placementFor(sheets, 'inbox', 'projects', 'before')).toEqual({
      parentId: null,
      index: 0,
    })
    expect(placementFor(sheets, 'beta', 'alpha', 'before')).toEqual({
      parentId: 'projects',
      index: 0,
    })
    expect(placementFor(sheets, 'inbox', 'alpha', 'after')).toEqual({
      parentId: 'projects',
      index: 1,
    })
    expect(placementFor(sheets, 'inbox', 'alpha', 'inside')).toEqual({
      parentId: 'alpha',
      index: 1,
    })
  })

  test('applying a placement reorders the siblings', () => {
    const moved = applyPlacement(sheets, 'beta', { parentId: 'projects', index: 0 })
    expect(titles(childrenOf(moved, 'projects'))).toEqual(['beta', 'alpha'])
    const nested = applyPlacement(sheets, 'inbox', { parentId: 'deep', index: 0 })
    expect(titles(childrenOf(nested, null))).toEqual(['projects'])
    expect(titles(ancestorsOf(nested, 'inbox'))).toEqual(['projects', 'alpha', 'deep'])
  })
})
