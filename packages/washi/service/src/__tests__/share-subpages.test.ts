import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { liveShareFor, openWorkspace, type Workspace } from '@washi/repository'
import { guardWashiDelete, SheetAccessError } from '../sheets/access'
import { updateSheetAccess, updateSheetShareSubpages } from '../sheets/look'
import { createSheetFromSource, updateSheetFromSource } from '../sheets/service'
import {
  ShareGoneError,
  sharedFileAllowed,
  sharedPage,
  sharedQuery,
  shareSettings,
} from '../sheets/share'
import { defineUserTable, runMutation } from '../tables/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'deals',
    columns: [
      { name: 'client', type: 'text' },
      { name: 'amount', type: 'number' },
    ],
  })
  runMutation(ws, { kind: 'insert', table: 'deals', data: { client: 'Acme', amount: 40000 } })
})
afterEach(() => ws.close())

const page = (title: string, parentId: string | null, body = '<Text>x</Text>', props = '') =>
  createSheetFromSource(
    ws,
    { title, source: `<Sheet title="${title}"${props}>${body}</Sheet>` },
    parentId,
  ).id

/** A public home with two sub-pages, one of them with its own child, and one private one. */
function homeWithSubpages() {
  const home = page('Home', null, '<Subpages layout="cards" />')
  updateSheetAccess(ws, home, { visibility: 'public', access: [] }, 'rin')
  const guide = page(
    'Guide',
    home,
    '<Text>Read me.</Text><Redact reason="names"><Text>Secret names</Text></Redact><Table bind={{ table: "deals" }} redact={["amount"]} />',
    ' cover="file:01a1-cover"',
  )
  const deeper = page('Deeper', guide)
  const hidden = page('Hidden', home, '<Text>Members only</Text>', ' visibility="private"')
  const underHidden = page('Under hidden', hidden)
  const token = liveShareFor(ws, home)?.token ?? ''
  return { home, guide, deeper, hidden, underHidden, token }
}

describe('a link that opens its sub-pages (D123)', () => {
  test('is off by default: the link is its own page alone', () => {
    const { token, guide } = homeWithSubpages()
    expect(sharedPage(ws, token).pages).toEqual([])
    expect(() => sharedPage(ws, token, guide)).toThrow(ShareGoneError)
  })

  test('a person turns it on, and the link lists the tree without private pages', () => {
    const { home, guide, deeper, token } = homeWithSubpages()
    updateSheetShareSubpages(ws, home, true)
    expect(shareSettings(ws, home).subpages).toBe(true)
    const shared = sharedPage(ws, token)
    expect(shared.pages.map((entry) => [entry.title, entry.parentId])).toEqual([
      ['Guide', home],
      ['Deeper', guide],
    ])
    expect(shared.home).toMatchObject({ id: home, title: 'Home' })
    expect(shared.source).not.toContain('subpages')
    expect(sharedPage(ws, token, deeper).title).toBe('Deeper')
  })

  test('a sub-page arrives redacted, reads its own tables, and takes no suggestions', () => {
    const { home, guide, token } = homeWithSubpages()
    updateSheetShareSubpages(ws, home, true)
    const shared = sharedPage(ws, token, guide)
    expect(shared.source).toContain('Read me.')
    expect(shared.source).not.toContain('Secret names')
    expect(shared.suggest).toBe(false)
    const rows = sharedQuery(ws, token, { table: 'deals' }, guide).rows
    expect(rows[0]).toMatchObject({ client: 'Acme' })
    expect(rows[0]).not.toHaveProperty('amount')
    // The home page shows no table: asking as it is refused.
    expect(() => sharedQuery(ws, token, { table: 'deals' })).toThrow()
  })

  test('a private sub-page, and anything under it, reads like a gone link', () => {
    const { home, hidden, underHidden, token } = homeWithSubpages()
    updateSheetShareSubpages(ws, home, true)
    expect(() => sharedPage(ws, token, hidden)).toThrow(ShareGoneError)
    expect(() => sharedPage(ws, token, underHidden)).toThrow(ShareGoneError)
    expect(() => sharedPage(ws, token, 'no-such-page')).toThrow(ShareGoneError)
  })

  test('a page outside the tree is not opened by naming it', () => {
    const { home, token } = homeWithSubpages()
    updateSheetShareSubpages(ws, home, true)
    const elsewhere = page('Elsewhere', null)
    expect(() => sharedPage(ws, token, elsewhere)).toThrow(ShareGoneError)
  })

  test('a sub-page card’s cover is served through the link', () => {
    const { home, token } = homeWithSubpages()
    expect(sharedFileAllowed(ws, token, '01a1-cover')).toBe(false)
    updateSheetShareSubpages(ws, home, true)
    expect(sharedFileAllowed(ws, token, '01a1-cover')).toBe(true)
  })

  test('the link stops opening them when the home page stops being public', () => {
    const { home, guide, token } = homeWithSubpages()
    updateSheetShareSubpages(ws, home, true)
    updateSheetAccess(ws, home, { visibility: 'shared', access: [] }, 'rin')
    expect(() => sharedPage(ws, token, guide)).toThrow(ShareGoneError)
  })

  test('Washi never flips the switch, nor un-redacts or trashes a page the link opens', () => {
    const { home, guide } = homeWithSubpages()
    const homeSource = '<Sheet title="Home" visibility="public"><Subpages /></Sheet>'
    expect(() =>
      updateSheetFromSource(
        ws,
        home,
        { title: 'Home', source: homeSource.replace('public"', 'public" subpages') },
        'washi',
      ),
    ).toThrow(SheetAccessError)
    updateSheetShareSubpages(ws, home, true)
    expect(() =>
      updateSheetFromSource(
        ws,
        guide,
        { title: 'Guide', source: '<Sheet title="Guide"><Text>All of it.</Text></Sheet>' },
        'washi',
      ),
    ).toThrow(/public link/)
    expect(() => guardWashiDelete(ws, [guide])).toThrow(SheetAccessError)
  })
})
