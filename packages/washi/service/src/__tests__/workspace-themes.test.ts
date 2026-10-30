import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { THEMES } from '@washi/paper/registry'
import { listWorkspaceThemes, liveShareFor, openWorkspace, type Workspace } from '@washi/repository'
import { updateSheetAccess, updateSheetMetaAndLook } from '../sheets/look'
import { createSheetFromSource } from '../sheets/service'
import { sharedPage } from '../sheets/share'
import {
  addWorkspaceTheme,
  editWorkspaceTheme,
  removeWorkspaceTheme,
  themeSlug,
  WorkspaceThemeError,
} from '../themes/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

const write = (name: string) => ({ name, light: THEMES.nord.light, dark: THEMES.nord.dark })
const maker = { id: 'ana', mayChangeAny: false }

describe('a workspace makes its own page themes', () => {
  test('the slug is plain, free, and kept through a rename', () => {
    expect(themeSlug('Kōbai Night!')).toBe('kobai-night')
    const first = addWorkspaceTheme(ws, write('Our Nord'), 'ana')
    const second = addWorkspaceTheme(ws, write('Our Nord!'), 'ana')
    expect([first.slug, second.slug]).toEqual(['our-nord', 'our-nord-2'])
    const renamed = editWorkspaceTheme(ws, first.id, write('Fjord'), maker)
    expect(renamed).toMatchObject({ name: 'Fjord', slug: 'our-nord' })
  })

  test('a name already taken, in any case, is refused in words; keeping its own name is not', () => {
    const first = addWorkspaceTheme(ws, write('zz-night'), 'ana')
    expect(() => addWorkspaceTheme(ws, write(' ZZ-Night '), 'ben')).toThrow(
      'This workspace already has a theme named “zz-night” — pick another name',
    )
    const second = addWorkspaceTheme(ws, write('Dusk'), 'ana')
    expect(() => editWorkspaceTheme(ws, second.id, write('ZZ-NIGHT'), maker)).toThrow(
      WorkspaceThemeError,
    )
    expect(editWorkspaceTheme(ws, first.id, write('ZZ-Night'), maker).name).toBe('ZZ-Night')
    expect(listWorkspaceThemes(ws)).toHaveLength(2)
  })

  test('ink nobody can read is refused, in words', () => {
    const faded = { ...write('Fog'), light: { ...THEMES.nord.light, ink: '#C8CCD4' } }
    expect(() => addWorkspaceTheme(ws, faded, 'ana')).toThrow(/Ink on the page is .*:1 in light/)
    expect(listWorkspaceThemes(ws)).toHaveLength(0)
  })

  test('its maker or a steward changes it; anyone else is told who can', () => {
    const theme = addWorkspaceTheme(ws, write('Mine'), 'ana')
    const other = { id: 'ben', mayChangeAny: false }
    expect(() => removeWorkspaceTheme(ws, theme.id, other)).toThrow(WorkspaceThemeError)
    removeWorkspaceTheme(ws, theme.id, { id: 'ben', mayChangeAny: true })
    expect(listWorkspaceThemes(ws)).toHaveLength(0)
  })

  test('a page wears it by key, and a public link carries its tokens', () => {
    const theme = addWorkspaceTheme(ws, write('Linked'), 'ana')
    const sheet = createSheetFromSource(ws, {
      title: 'P',
      source: '<Sheet title="P"><Text>x</Text></Sheet>',
    })
    updateSheetMetaAndLook(ws, sheet.id, { theme: `ws:${theme.slug}` })
    updateSheetAccess(ws, sheet.id, { visibility: 'public', access: [] }, 'ana')
    const token = liveShareFor(ws, sheet.id)?.token ?? ''
    expect(sharedPage(ws, token).theme).toEqual({
      name: 'Linked',
      light: THEMES.nord.light,
      dark: THEMES.nord.dark,
    })
    removeWorkspaceTheme(ws, theme.id, maker)
    expect(sharedPage(ws, token).theme).toBeNull()
  })
})
