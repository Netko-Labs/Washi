import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  getSheet,
  getTableByName,
  insertSuggestion,
  listRecordChanges,
  liveShareFor,
  openWorkspace,
  type Workspace,
} from '@washi/repository'
import { parse } from '@washi/wsx'
import { guardWashiWrite, SheetNotFoundError } from '../sheets/access'
import { updateSheetAccess, updateSheetSuggest } from '../sheets/look'
import { createSheetFromSource, updateSheetFromSource } from '../sheets/service'
import { ShareRefusedError, sharedPage, sharedQuery } from '../sheets/share'
import { writableColumns } from '../suggestions/allowed'
import { approveSuggestion, declineSuggestion } from '../suggestions/decide'
import { SuggestionError, SuggestionRefusedError } from '../suggestions/errors'
import { suggestionInbox } from '../suggestions/inbox'
import { sharedRequested, sharedWritable, suggestRow } from '../suggestions/link'
import { defineUserTable, runMutation, runQuery } from '../tables/service'

let ws: Workspace
const ANA = { name: 'Ana Ruiz', email: 'ana@example.com' }
const MEMBER = { id: 'rin', isOwner: false }
const LATER = () => Date.now() + 11 * 60_000

const SOURCE = `<Sheet title="Book a call">
  <Slots bind={{ table: "appts" }} date="when" add={["title", "with_whom"]} />
  <Agenda bind={{ table: "appts" }} date="when" add={["title", "notes"]} redact={["title", "with_whom", "notes"]} />
  <Form table="ideas" fields={["idea"]} defaults={{ status: "new" }} />
</Sheet>`

beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'appts',
    columns: [
      { name: 'title', type: 'text' },
      { name: 'with_whom', type: 'text' },
      { name: 'notes', type: 'text' },
      { name: 'when', type: 'date' },
      { name: 'secret', type: 'text' },
      { name: 'loud', type: 'formula', expr: "title + '!'" },
    ],
  })
  defineUserTable(ws, {
    name: 'ideas',
    columns: [
      { name: 'idea', type: 'text' },
      { name: 'status', type: 'select', options: ['new', 'done'] },
      { name: 'owner', type: 'text' },
    ],
  })
  runMutation(ws, {
    kind: 'insert',
    table: 'appts',
    data: { title: 'Board review', with_whom: 'Kōbō', when: '2026-11-03T09:00/2026-11-03T09:30' },
  })
})
afterEach(() => ws.close())

function link(suggest: boolean) {
  const sheet = createSheetFromSource(ws, { title: 'Book a call', source: SOURCE })
  updateSheetAccess(ws, sheet.id, { visibility: 'public', access: [] }, 'rin')
  if (suggest) updateSheetSuggest(ws, sheet.id, true)
  return { id: sheet.id, token: liveShareFor(ws, sheet.id)?.token ?? '' }
}

const book = (token: string, when: string, ip = 'ip-a', now = Date.now()) =>
  suggestRow(ws, token, { table: 'appts', cells: { title: 'Intro', when }, ...ANA }, ip, now)

describe('what a page lets a visitor write (D120)', () => {
  test('exactly the columns its own adds name or seed, redacted ones included', () => {
    const root = parse(SOURCE)
    const appts = getTableByName(ws, 'appts')?.spec
    const ideas = getTableByName(ws, 'ideas')?.spec
    if (!appts || !ideas) throw new Error('tables missing')
    expect([...writableColumns(root, appts)].sort()).toEqual([
      'notes',
      'title',
      'when',
      'with_whom',
    ])
    expect([...writableColumns(root, ideas)].sort()).toEqual(['idea', 'status'])
  })

  test('a Form without fields writes every stored column, never a computed one', () => {
    const root = parse('<Sheet title="T"><Form table="appts" /></Sheet>')
    const appts = getTableByName(ws, 'appts')?.spec
    if (!appts) throw new Error('table missing')
    expect(writableColumns(root, appts).has('secret')).toBe(true)
    expect(writableColumns(root, appts).has('loud')).toBe(false)
  })

  test('a board takes its group and its title column', () => {
    const root = parse(
      '<Sheet title="T"><Board bind={{ table: "ideas" }} groupBy="status" /></Sheet>',
    )
    const ideas = getTableByName(ws, 'ideas')?.spec
    if (!ideas) throw new Error('table missing')
    expect([...writableColumns(root, ideas)].sort()).toEqual(['idea', 'status'])
  })
})

describe('a link that does not take suggestions is read-only', () => {
  test('it says so in its payload and refuses every suggestion', () => {
    const { token } = link(false)
    expect(sharedPage(ws, token).suggest).toBe(false)
    expect(sharedWritable(ws, token, 'appts')).toBeNull()
    expect(() => book(token, '2026-11-03T10:00/2026-11-03T10:30')).toThrow(ShareRefusedError)
  })

  test('only a person turns suggestions on or off, never Washi', () => {
    const before = parse('<Sheet title="T" visibility="public"></Sheet>')
    const after = parse('<Sheet title="T" visibility="public" suggest={true}></Sheet>')
    expect(() => guardWashiWrite(before, after)).toThrow(/Only a person/)
    expect(() => guardWashiWrite(after, before)).toThrow(/Only a person/)
  })

  test('the cache follows the page on every write: kept while the source keeps it', () => {
    const { id } = link(true)
    const source = (getSheet(ws, id)?.source ?? '').replace(
      '</Sheet>',
      '  <Text>More.</Text>\n</Sheet>',
    )
    expect(source).toContain('suggest')
    updateSheetFromSource(ws, id, { title: 'Book a call', source })
    expect(getSheet(ws, id)?.suggest).toBe(true)
    updateSheetFromSource(ws, id, { title: 'Book a call', source: source.replace(' suggest', '') })
    expect(getSheet(ws, id)?.suggest).toBe(false)
  })
})

describe('a suggestion through a link', () => {
  test('waits, writes nothing, and never reads a redacted value back', () => {
    const { token } = link(true)
    expect(sharedPage(ws, token).suggest).toBe(true)
    expect(sharedPage(ws, token).source).not.toContain('suggest')
    const writable = sharedWritable(ws, token, 'appts')
    expect(writable?.columns.map((column) => column.name)).toEqual([
      'title',
      'with_whom',
      'notes',
      'when',
    ])
    expect(book(token, '2026-11-03T10:00/2026-11-03T10:30').id).toBeString()
    expect(runQuery(ws, { table: 'appts' }).rows).toHaveLength(1)
    const rows = sharedQuery(ws, token, { table: 'appts' }).rows
    expect(rows[0]).not.toHaveProperty('title')
    expect(rows[0]).not.toHaveProperty('with_whom')
    const spans = sharedRequested(ws, token, {
      table: 'appts',
      date: 'when',
      from: '2026-11-02',
      to: '2026-11-09',
    })
    expect(spans).toEqual(['2026-11-03T10:00/2026-11-03T10:30'])
    expect(JSON.stringify(spans)).not.toContain('Ana')
  })

  test('refuses a column the page does not ask for, and a cell ink would refuse', () => {
    const { token } = link(true)
    const send = (cells: Record<string, string>) =>
      suggestRow(ws, token, { table: 'appts', cells, ...ANA }, 'ip-a')
    expect(() => send({ secret: 'x' })).toThrow(/not something this page asks for/)
    expect(() => send({ title: 'x'.repeat(10_001) })).toThrow(SuggestionRefusedError)
    expect(() => send({})).toThrow(/Fill in a field first/)
  })

  test('a filled trap is taken in silence and kept nowhere', () => {
    const { token } = link(true)
    const cells = { title: 'Spam', when: '2026-11-04' }
    const sent = suggestRow(ws, token, { table: 'appts', cells, ...ANA, trap: 'x' }, 'ip-a')
    expect(sent.id).toBeNull()
    expect(suggestionInbox(ws, MEMBER).items).toHaveLength(0)
  })
})

describe('limits, each in words', () => {
  test('five in ten minutes from one address, then a pause', () => {
    const { token } = link(true)
    for (let day = 10; day < 15; day++) book(token, `2026-11-${day}T10:00`)
    expect(() => book(token, '2026-11-16T10:00')).toThrow(/wait a little/)
    expect(book(token, '2026-11-16T10:00', 'ip-b').id).toBeString()
    expect(book(token, '2026-11-17T10:00', 'ip-a', LATER()).id).toBeString()
  })

  test('thirty a day from one address', () => {
    const { token } = link(true)
    for (let index = 0; index < 30; index++) {
      const day = String(1 + (index % 28)).padStart(2, '0')
      const month = index < 28 ? '12' : '11'
      book(token, `2026-${month}-${day}T${index < 28 ? '11' : '15'}:00`, 'ip-a', LATER())
    }
    expect(() => book(token, '2026-11-20T16:00', 'ip-a', LATER())).toThrow(/a day allows/)
  })

  test('two hundred waiting on one page', () => {
    const { id, token } = link(true)
    for (let index = 0; index < 200; index++) {
      insertSuggestion(ws, {
        sheetId: id,
        tableName: 'ideas',
        kind: 'row',
        dateColumn: null,
        cells: { idea: `#${index}` },
        visitorName: 'Bot',
        visitorEmail: 'bot@example.com',
        ipHash: `ip-${index}`,
      })
    }
    expect(() => book(token, '2026-11-03T12:00')).toThrow(/too many suggestions waiting/)
  })
})

describe('a requested time is held', () => {
  test('a booked or requested slot is refused at send', () => {
    const { token } = link(true)
    expect(() => book(token, '2026-11-03T09:00/2026-11-03T09:30')).toThrow(/just booked/)
    book(token, '2026-11-03T10:00/2026-11-03T10:30')
    expect(() => book(token, '2026-11-03T10:00/2026-11-03T10:30', 'ip-b')).toThrow(/just requested/)
  })

  test('an Agenda day is not a slot: a busy day still takes another event', () => {
    const { token } = link(true)
    const cells = { title: 'Lunch', notes: 'Bring the deck', when: '2026-11-03' }
    const sent = suggestRow(ws, token, { table: 'appts', cells, ...ANA }, 'ip-a')
    expect(sent.id).toBeString()
    expect(suggestionInbox(ws, MEMBER).items[0]).toMatchObject({ kind: 'booking' })
  })

  test('approval checks the time again', () => {
    const { token } = link(true)
    const { id } = book(token, '2026-11-03T10:00/2026-11-03T10:30')
    runMutation(ws, {
      kind: 'insert',
      table: 'appts',
      data: { title: 'Walk-in', when: '2026-11-03T10:00/2026-11-03T10:30' },
    })
    expect(() => approveSuggestion(ws, id ?? '', MEMBER)).toThrow(/booked now/)
  })
})

describe('a member decides in the Inbox', () => {
  test('approve lands the row through insertRecord, signed by the member', () => {
    const { token } = link(true)
    const { id } = book(token, '2026-11-03T11:00/2026-11-03T11:30')
    const [waiting] = suggestionInbox(ws, MEMBER).items
    expect(waiting).toMatchObject({ visitorName: 'Ana Ruiz', kind: 'booking', dateColumn: 'when' })
    const { recordId } = approveSuggestion(ws, id ?? '', MEMBER)
    expect(recordId).toBeString()
    expect(listRecordChanges(ws, recordId ?? '')[0]?.author).toBe('rin')
    const rows = runQuery(ws, { table: 'appts' }).rows
    expect(rows.find((row) => row.id === recordId)).toMatchObject({ title: 'Intro' })
    expect(suggestionInbox(ws, MEMBER).items).toHaveLength(0)
    expect(() => approveSuggestion(ws, id ?? '', MEMBER)).toThrow(SuggestionError)
  })

  test('decline keeps nothing and frees the time', () => {
    const { token } = link(true)
    const { id } = book(token, '2026-11-03T11:00/2026-11-03T11:30')
    declineSuggestion(ws, id ?? '', MEMBER)
    expect(runQuery(ws, { table: 'appts' }).rows).toHaveLength(1)
    expect(book(token, '2026-11-03T11:00/2026-11-03T11:30', 'ip-b').id).toBeString()
  })

  test('pages the member cannot read never crowd out the ones they can', () => {
    const { token } = link(true)
    book(token, '2026-11-03T11:00/2026-11-03T11:30')
    const { id: hidden } = link(true)
    updateSheetAccess(ws, hidden, { visibility: 'private', access: ['mei'] }, 'mei')
    for (let index = 0; index < 200; index++) {
      insertSuggestion(ws, {
        sheetId: hidden,
        tableName: 'ideas',
        kind: 'row',
        dateColumn: null,
        cells: { idea: `#${index}` },
        visitorName: 'Bot',
        visitorEmail: 'bot@example.com',
        ipHash: `ip-${index}`,
      })
    }
    expect(suggestionInbox(ws, MEMBER).items.map((item) => item.visitorName)).toEqual(['Ana Ruiz'])
  })

  test('a member who cannot read the page never sees it', () => {
    const { id: sheetId, token } = link(true)
    const { id } = book(token, '2026-11-03T11:00/2026-11-03T11:30')
    updateSheetAccess(ws, sheetId, { visibility: 'private', access: ['rin'] }, 'rin')
    expect(suggestionInbox(ws, { id: 'mei', isOwner: false }).items).toHaveLength(0)
    expect(() => approveSuggestion(ws, id ?? '', { id: 'mei', isOwner: false })).toThrow(
      SheetNotFoundError,
    )
  })
})
