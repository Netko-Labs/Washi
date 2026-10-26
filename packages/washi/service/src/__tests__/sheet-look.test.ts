import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { createSheet, getAppMeta, getSheet, openWorkspace, type Workspace } from '@washi/repository'
import { liftLooksIntoSource, updateSheetMetaAndLook } from '../sheets/look'
import { createSheetFromSource, undoWashiWrite, updateSheetFromSource } from '../sheets/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

const source = (props = '') => `<Sheet title="Matcha"${props}><Text>three spots</Text></Sheet>`

describe('the look lives in the page (D64)', () => {
  test('every write re-reads icon and cover off the <Sheet>', () => {
    const sheet = createSheetFromSource(ws, {
      title: 'Matcha',
      source: source(' icon="🦊" cover="picture:canyon"'),
    })
    expect(sheet).toMatchObject({ icon: '🦊', cover: 'picture:canyon' })

    const bare = updateSheetFromSource(ws, sheet.id, { title: 'Matcha', source: source() })
    expect(bare).toMatchObject({ icon: null, cover: null })
  })

  test('picking a cover writes it into the source, and counts as an edit', () => {
    const sheet = createSheetFromSource(ws, { title: 'Matcha', source: source() })
    const picked = updateSheetMetaAndLook(ws, sheet.id, { cover: 'preset:sage', icon: 'book' })
    expect(picked.source).toContain('cover="preset:sage"')
    expect(picked.source).toContain('icon="book"')
    expect(picked).toMatchObject({ cover: 'preset:sage', icon: 'book' })
    expect(picked.hlcUpdated).not.toBe(sheet.hlcUpdated)

    const removed = updateSheetMetaAndLook(ws, sheet.id, { cover: null })
    expect(removed.source).not.toContain('cover=')
    expect(removed.cover).toBeNull()
    expect(removed.icon).toBe('book')
  })

  test('width alone still never touches the page', () => {
    const sheet = createSheetFromSource(ws, { title: 'Matcha', source: source() })
    const wide = updateSheetMetaAndLook(ws, sheet.id, { fullWidth: true })
    expect(wide.source).toBe(sheet.source)
    expect(wide.hlcUpdated).toBe(sheet.hlcUpdated)
  })

  test('Undo takes back the look Washi wrote, with the page', () => {
    const sheet = createSheetFromSource(ws, { title: 'Matcha', source: source(' icon="🦊"') })
    updateSheetFromSource(
      ws,
      sheet.id,
      { title: 'Matcha', source: source(' icon="leaf" cover="preset:matcha"') },
      'washi',
    )
    expect(undoWashiWrite(ws, sheet.id)).toMatchObject({ icon: '🦊', cover: null })
  })

  test('the lift writes a column-only look into the source once, without an edit stamp', () => {
    const before = createSheet(
      ws,
      { title: 'Old', source: source(), icon: '🦊', cover: 'file:01a1767e-7ed7' },
      { body: 'three spots', refs: [] },
    )
    liftLooksIntoSource(ws)
    const lifted = getSheet(ws, before.id)
    expect(lifted?.source).toContain('icon="🦊"')
    expect(lifted?.source).toContain('cover="file:01a1767e-7ed7"')
    expect(lifted?.hlcUpdated).toBe(before.hlcUpdated)
    expect(lifted?.editedBy).toBeNull()
    expect(getAppMeta(ws, 'look_in_source')).toBe('1')
  })

  test('a bare pre-D60 preset is lifted as a key', () => {
    const before = createSheet(
      ws,
      { title: 'Old', source: source(), cover: 'sage' },
      { body: 'three spots', refs: [] },
    )
    liftLooksIntoSource(ws)
    expect(getSheet(ws, before.id)).toMatchObject({ cover: 'preset:sage' })
  })
})
