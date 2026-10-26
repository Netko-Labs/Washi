import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  accessRows,
  createSheet,
  deleteSheet,
  getAppMeta,
  getSheet,
  liveShareFor,
  openWorkspace,
  shareByToken,
  type Workspace,
} from '@washi/repository'
import { canRead, NOBODY, readableIds, SheetAccessError } from '../sheets/access'
import { forgetUnenforcedVisibility, updateSheetAccess } from '../sheets/look'
import { createSheetFromSource, updateSheetFromSource } from '../sheets/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

const RIN = { id: 'rin', isOwner: false }
const KENJI = { id: 'kenji', isOwner: false }
const OWNER = { id: 'juan', isOwner: true }

const page = (props = '', body = '<Text>q4</Text>', parentId: string | null = null) =>
  createSheetFromSource(
    ws,
    { title: 'Plan', source: `<Sheet title="Plan"${props}>${body}</Sheet>` },
    parentId,
  )

describe('who reads a page (D65)', () => {
  test('a private page opens for the people it lists and the owner, nobody else', () => {
    const plan = page(' visibility="private" access={["rin"]}')
    expect(canRead(ws, plan.id, RIN)).toBe(true)
    expect(canRead(ws, plan.id, OWNER)).toBe(true)
    expect(canRead(ws, plan.id, KENJI)).toBe(false)
    expect(canRead(ws, plan.id, NOBODY)).toBe(false)
  })

  test('a sub-page is as closed as its most closed ancestor, and so is the Trash', () => {
    const plan = page(' visibility="private" access={["rin"]}')
    const child = page('', '<Text>inside</Text>', plan.id)
    expect(readableIds(accessRows(ws), KENJI).has(child.id)).toBe(false)
    expect(readableIds(accessRows(ws), RIN).has(child.id)).toBe(true)
    deleteSheet(ws, plan.id)
    expect(readableIds(accessRows(ws), KENJI).has(plan.id)).toBe(false)
  })

  test('narrowing a page keeps whoever narrowed it inside', () => {
    const plan = page()
    const closed = updateSheetAccess(ws, plan.id, { visibility: 'private', access: [] }, 'rin')
    expect(closed).toMatchObject({ visibility: 'private', access: ['rin'] })
    expect(closed.source).toContain('visibility="private"')
  })

  test('public opens one link; leaving public kills it for good', () => {
    const plan = page()
    updateSheetAccess(ws, plan.id, { visibility: 'public', access: [] }, 'rin')
    const link = liveShareFor(ws, plan.id)
    expect(link?.token).toBeTruthy()
    updateSheetAccess(ws, plan.id, { visibility: 'shared', access: [] }, 'rin')
    expect(liveShareFor(ws, plan.id)).toBeNull()
    expect(shareByToken(ws, link?.token ?? '')).toBeNull()
  })
})

describe('Washi and access', () => {
  test('Washi never changes who reads a page', () => {
    const plan = page(' visibility="private" access={["rin"]}')
    expect(() =>
      updateSheetFromSource(
        ws,
        plan.id,
        { title: 'Plan', source: '<Sheet title="Plan"><Text>q4</Text></Sheet>' },
        'washi',
      ),
    ).toThrow(SheetAccessError)
    expect(() =>
      createSheetFromSource(
        ws,
        { title: 'Out', source: '<Sheet title="Out" visibility="public"><Text>x</Text></Sheet>' },
        null,
        'washi',
      ),
    ).toThrow(SheetAccessError)
  })

  test('on a public page Washi keeps every redaction', () => {
    const plan = page(' visibility="public"', '<Redact reason="budget"><Text>$40k</Text></Redact>')
    expect(() =>
      updateSheetFromSource(
        ws,
        plan.id,
        {
          title: 'Plan',
          source: '<Sheet title="Plan" visibility="public"><Text>$40k</Text></Sheet>',
        },
        'washi',
      ),
    ).toThrow(SheetAccessError)
    const kept = updateSheetFromSource(
      ws,
      plan.id,
      {
        title: 'Plan',
        source:
          '<Sheet title="Plan" visibility="public"><Title>Plan</Title><Redact reason="budget"><Text>$45k</Text></Redact></Sheet>',
      },
      'washi',
    )
    expect(kept.source).toContain('$45k')
  })
})

test('a visibility written before D65 is forgotten once, quietly', () => {
  const old = createSheet(
    ws,
    { title: 'Old', source: '<Sheet title="Old" visibility="public"><Text>x</Text></Sheet>' },
    { body: 'x', refs: [] },
  )
  forgetUnenforcedVisibility(ws)
  const after = getSheet(ws, old.id)
  expect(after?.source).not.toContain('visibility')
  expect(after?.hlcUpdated).toBe(old.hlcUpdated)
  expect(liveShareFor(ws, old.id)).toBeNull()
  expect(getAppMeta(ws, 'visibility_enforced')).toBe('1')
})
