import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { getSheet, openWorkspace, sheetVersion, type Workspace } from '@washi/repository'
import { createSheetFromSource, SheetConflictError, updateSheetFromSource } from '../sheets/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

const page = (...lines: string[]) => ({
  title: 'Plan',
  source: `<Sheet title="Plan">\n${lines.map((line) => `  <Text>${line}</Text>`).join('\n')}\n</Sheet>\n`,
})

describe('two writers, one page', () => {
  test('edits made against the same version both survive', () => {
    const { id } = createSheetFromSource(ws, page('one', 'two', 'three'))
    const read = sheetVersion(ws, id) ?? ''
    updateSheetFromSource(ws, id, page('ONE', 'two', 'three'), null, read)
    const merged = updateSheetFromSource(ws, id, page('one', 'two', 'THREE'), 'washi', read)
    expect(merged.source).toContain('<Text>ONE</Text>')
    expect(merged.source).toContain('<Text>THREE</Text>')
  })

  test('without a version, the last write replaces — as before', () => {
    const { id } = createSheetFromSource(ws, page('one'))
    updateSheetFromSource(ws, id, page('mine'))
    expect(updateSheetFromSource(ws, id, page('theirs')).source).toContain('theirs')
    expect(getSheet(ws, id)?.source).not.toContain('mine')
  })

  test('a version the page never had is a conflict, not a silent overwrite', () => {
    const { id } = createSheetFromSource(ws, page('one'))
    expect(() => updateSheetFromSource(ws, id, page('two'), null, 'not-a-version')).toThrow(
      SheetConflictError,
    )
  })
})
