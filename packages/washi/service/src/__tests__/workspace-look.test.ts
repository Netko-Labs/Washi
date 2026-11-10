import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { THEMES } from '@washi/paper/registry'
import { getSheet, openWorkspace, type Workspace } from '@washi/repository'
import { createSheetFromSource } from '../sheets/service'
import { setWorkspaceLook, workspaceLook } from '../themes/look'
import { defineWorkspaceTheme, WorkspaceThemeError } from '../themes/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'look', path: ':memory:' })
})
afterEach(() => ws.close())

const MIRIN = {
  light: {
    bg: '#F7F4EC',
    card: '#FFFDF8',
    ink: '#14100C',
    muted: '#6B5F52',
    border: '#E4DCCD',
    mutedBg: '#EFE8DA',
    accent: '#8A4B12',
    accentInk: '#FFFFFF',
  },
  dark: {
    bg: '#14100C',
    card: '#1D1813',
    ink: '#F7F4EC',
    muted: '#B3A796',
    border: '#3A3128',
    mutedBg: '#251F18',
    accent: '#DD9A3F',
    accentInk: '#14100C',
  },
}
const ana = { id: 'ana', mayChangeAny: false }

describe('a theme defined by its slug (D139)', () => {
  test('a new slug is made by its caller; the same slug changes in place', () => {
    const made = defineWorkspaceTheme(ws, { slug: 'mirin', name: 'mirin', ...MIRIN }, ana)
    expect(made).toMatchObject({ created: true, warnings: [] })
    expect(made.theme).toMatchObject({ slug: 'mirin', createdBy: 'ana' })

    const again = defineWorkspaceTheme(ws, { slug: 'ws:mirin', name: 'mirin brand', ...MIRIN }, ana)
    expect(again).toMatchObject({ created: false })
    expect(again.theme).toMatchObject({ id: made.theme.id, name: 'mirin brand', slug: 'mirin' })
  })

  test('someone else’s theme changes only for a steward; a bad slug or contrast is refused', () => {
    defineWorkspaceTheme(ws, { slug: 'mirin', name: 'mirin', ...MIRIN }, ana)
    const ben = { id: 'ben', mayChangeAny: false }
    expect(() => defineWorkspaceTheme(ws, { slug: 'mirin', name: 'mirin', ...MIRIN }, ben)).toThrow(
      'only the person who made a theme, or an owner, can change it',
    )
    expect(() =>
      defineWorkspaceTheme(
        ws,
        { slug: 'mirin', name: 'mirin', ...MIRIN },
        { ...ben, mayChangeAny: true },
      ),
    ).not.toThrow()

    expect(() =>
      defineWorkspaceTheme(ws, { slug: 'Mirin Amber', name: 'x', ...MIRIN }, ana),
    ).toThrow(WorkspaceThemeError)
    const unreadable = { ...MIRIN, light: { ...MIRIN.light, ink: '#EEEEEE' } }
    expect(() =>
      defineWorkspaceTheme(ws, { slug: 'pale', name: 'Pale', ...unreadable }, ana),
    ).toThrow('Ink on the page')
    expect(() => defineWorkspaceTheme(ws, { slug: 'other', name: 'MIRIN', ...MIRIN }, ana)).toThrow(
      'already has a theme named',
    )
  })

  test('a pairing that reads, but not well, is saved and said', () => {
    const quiet = { ...MIRIN, light: { ...MIRIN.light, muted: '#8A7F72' } }
    const { warnings } = defineWorkspaceTheme(ws, { slug: 'quiet', name: 'Quiet', ...quiet }, ana)
    expect(warnings.some((each) => each.startsWith('Quiet ink'))).toBe(true)
  })

  test('the house themes still pass as they are', () => {
    const { light, dark } = THEMES.nord
    expect(defineWorkspaceTheme(ws, { slug: 'nord', name: 'Nord', light, dark }, ana).created).toBe(
      true,
    )
  })
})

describe('the workspace’s default icon and cover (D139)', () => {
  test('nothing until set; a part left out stays, null clears it', () => {
    expect(workspaceLook(ws)).toEqual({ icon: null, cover: null })
    setWorkspaceLook(ws, { icon: 'rocket', cover: 'preset:paper' })
    expect(setWorkspaceLook(ws, { cover: 'picture:fjord' })).toEqual({
      icon: 'rocket',
      cover: 'picture:fjord',
    })
    expect(setWorkspaceLook(ws, { icon: null })).toEqual({ icon: null, cover: 'picture:fjord' })
    expect(workspaceLook(ws)).toEqual({ icon: null, cover: 'picture:fjord' })
  })

  test('a miss names what would do, and no page source is written', () => {
    const page = createSheetFromSource(
      ws,
      { title: 'Plain', source: '<Sheet title="Plain"><Text>hi</Text></Sheet>' },
      null,
    )
    expect(() => setWorkspaceLook(ws, { icon: 'rockett' })).toThrow('did you mean rocket')
    expect(() => setWorkspaceLook(ws, { cover: 'preset:kraft' })).toThrow('is not a cover')
    setWorkspaceLook(ws, { icon: '🍜', cover: 'file:01a1c2c8-2b0e-71e0-956c-ad19186498d5' })
    expect(getSheet(ws, page.id)).toMatchObject({ icon: null, cover: null })
  })
})
