import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { getSheet, openWorkspace, purgeSheet, type Workspace } from '@washi/repository'
import {
  createSheetFromSource,
  removeSheet,
  SheetUndoError,
  undoWashiWrite,
  updateSheetFromSource,
} from '../sheets/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

const write = (body: string) => ({
  title: 'Plan',
  source: `<Sheet title="Plan"><Text>${body}</Text></Sheet>`,
})
const body = (id: string) => getSheet(ws, id)?.source.match(/<Text>(.*)<\/Text>/)?.[1]

describe("Washi's writes are marked and undoable", () => {
  test('a page Washi made is marked, with nothing to undo', () => {
    const sheet = createSheetFromSource(ws, write('v1'), null, 'washi')
    expect(sheet.editedBy).toBe('washi')
    expect(sheet.undoable).toBe(false)
  })

  test('undo walks back through consecutive Washi writes, then stops', () => {
    const { id } = createSheetFromSource(ws, write('mine'))
    updateSheetFromSource(ws, id, write('w1'), 'washi')
    const latest = updateSheetFromSource(ws, id, write('w2'), 'washi')
    expect(latest).toMatchObject({ editedBy: 'washi', undoable: true })

    expect(undoWashiWrite(ws, id)).toMatchObject({ editedBy: 'washi', undoable: true })
    expect(body(id)).toBe('w1')
    expect(undoWashiWrite(ws, id)).toMatchObject({ editedBy: null, undoable: false })
    expect(body(id)).toBe('mine')
    expect(() => undoWashiWrite(ws, id)).toThrow(SheetUndoError)
  })

  test("a person's write takes the page back from Washi: no undo over their words", () => {
    const { id } = createSheetFromSource(ws, write('mine'))
    updateSheetFromSource(ws, id, write('w1'), 'washi')
    expect(updateSheetFromSource(ws, id, write('typed'))).toMatchObject({
      editedBy: null,
      undoable: false,
    })
    expect(() => undoWashiWrite(ws, id)).toThrow(SheetUndoError)
  })

  test('a save that changes nothing keeps the mark', () => {
    const { id } = createSheetFromSource(ws, write('mine'))
    updateSheetFromSource(ws, id, write('w1'), 'washi')
    expect(updateSheetFromSource(ws, id, write('w1'))).toMatchObject({
      editedBy: 'washi',
      undoable: true,
    })
  })

  test('a trashed page has nothing to undo; a purge takes the stack with it', () => {
    const { id } = createSheetFromSource(ws, write('mine'))
    updateSheetFromSource(ws, id, write('w1'), 'washi')
    removeSheet(ws, id)
    expect(() => undoWashiWrite(ws, id)).toThrow(SheetUndoError)
    purgeSheet(ws, id)
    expect(ws.sqlite.query('SELECT count(*) AS n FROM sheet_revisions').get()).toEqual({ n: 0 })
  })
})
