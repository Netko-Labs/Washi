import { describe, expect, test } from 'bun:test'
import type { SheetDetail } from '@washi/domain'
import { shownSheet } from '../lib/utils'

const sheet = (id: string, hlcUpdated: string): SheetDetail => ({
  id,
  title: id,
  icon: null,
  tags: [],
  parentId: null,
  position: 'a0',
  cover: null,
  fullWidth: false,
  editedBy: null,
  undoable: false,
  rowOf: null,
  visibility: 'shared',
  suggest: false,
  access: [],
  hlcUpdated,
  source: '<Sheet />',
  hlcCreated: hlcUpdated,
})

describe('the open page reloads only when what is drawn is not it', () => {
  test('the list catching up to the drawn page reloads nothing', () => {
    const shown = shownSheet()
    shown.loading()
    shown.drawn(sheet('a', 'x'))
    expect(shown.isDrawn('a', 'x')).toBe(true)
  })

  test('a new stamp or another page reloads', () => {
    const shown = shownSheet()
    shown.drawn(sheet('a', 'x'))
    expect(shown.isDrawn('a', 'y')).toBe(false)
    expect(shown.isDrawn('b', 'x')).toBe(false)
  })

  test('A, then B cut short, then A again loads A', () => {
    const shown = shownSheet()
    shown.loading()
    shown.drawn(sheet('a', 'x'))
    expect(shown.isDrawn('b', 'z')).toBe(false)
    shown.loading()
    expect(shown.isDrawn('a', 'x')).toBe(false)
  })

  test('a page that failed or went missing matches nothing', () => {
    const shown = shownSheet()
    shown.drawn(sheet('a', 'x'))
    shown.loading()
    expect(shown.isDrawn('a', 'x')).toBe(false)
  })
})
