import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  defineTable,
  deleteRecords,
  insertRecord,
  openWorkspace,
  searchRecords,
  trashTable,
  type Workspace,
} from '..'

let ws: Workspace
let issues: string
let notes: string

beforeEach(() => {
  ws = openWorkspace({ id: 'w', path: ':memory:' })
  issues = defineTable(ws, {
    name: 'issues',
    columns: [
      { name: 'title', type: 'text' },
      { name: 'labels', type: 'multi_select', options: ['auth', 'ui'] },
      { name: 'points', type: 'number' },
      { name: 'link', type: 'url' },
    ],
  }).id
  notes = defineTable(ws, { name: 'notes', columns: [{ name: 'body', type: 'text' }] }).id
})

afterEach(() => ws.close())

describe('searchRecords (D140)', () => {
  test('finds a row by the words in its cells, every word, case-blind', () => {
    const login = insertRecord(ws, issues, {
      title: 'Login times out on Safari',
      labels: ['auth'],
      points: 3,
    })
    insertRecord(ws, issues, { title: 'Logout button misaligned', labels: ['ui'] })
    const hits = searchRecords(ws, 'LOGIN safari')
    expect(hits).toEqual([
      {
        table: 'issues',
        recordId: login,
        title: 'Login times out on Safari',
        column: 'title',
        snippet: 'Login times out on Safari',
      },
    ])
    // A word in one cell and another in a list both count.
    expect(searchRecords(ws, 'safari auth').map((hit) => hit.recordId)).toEqual([login])
    expect(searchRecords(ws, 'auth')[0]).toMatchObject({ column: 'labels', snippet: 'auth' })
  })

  test('a word LIKE cannot narrow still reaches rows past the first page, any case', () => {
    const old = insertRecord(ws, notes, { body: 'Trip to MÜNCHEN in spring' })
    for (let at = 0; at < 2100; at++) insertRecord(ws, notes, { body: `note ${at}` })
    expect(searchRecords(ws, 'münchen').map((hit) => hit.recordId)).toEqual([old])
    expect(searchRecords(ws, 'München spring').map((hit) => hit.recordId)).toEqual([old])
  })

  test('every word counts, past eight too; a snippet sits on the word as written', () => {
    // İ lowercases to two characters, so an offset read off the lowercased words would be one off.
    const body = `İstanbul ${'x'.repeat(60)} one two three four five six seven eight nine`
    const long = insertRecord(ws, notes, { body })
    insertRecord(ws, notes, { body: 'one two three four five six seven eight' })
    expect(
      searchRecords(ws, 'one two three four five six seven eight nine').map((hit) => hit.recordId),
    ).toEqual([long])
    const [hit] = searchRecords(ws, 'nine')
    expect(hit?.snippet).toBe(`…${body.slice(body.indexOf('nine') - 40)}`)
  })

  test('keys, numbers and ids never match; LIKE wildcards are words', () => {
    insertRecord(ws, issues, { title: 'Plain', points: 42 })
    insertRecord(ws, issues, { title: '100% done_now' })
    expect(searchRecords(ws, 'points')).toEqual([])
    expect(searchRecords(ws, '42')).toEqual([])
    expect(searchRecords(ws, '%').map((hit) => hit.title)).toEqual(['100% done_now'])
    expect(searchRecords(ws, '_')).toHaveLength(1)
    expect(searchRecords(ws, '   ')).toEqual([])
  })

  test('words beyond ASCII match whatever their case', () => {
    insertRecord(ws, notes, { body: 'Réunion à Écully' })
    expect(searchRecords(ws, 'écully')).toHaveLength(1)
  })

  test('a deleted row and a trashed table do not match', () => {
    const gone = insertRecord(ws, issues, { title: 'Flaky checkout test' })
    insertRecord(ws, notes, { body: 'checkout notes' })
    expect(searchRecords(ws, 'checkout')).toHaveLength(2)
    deleteRecords(ws, issues, [gone])
    trashTable(ws, notes)
    expect(searchRecords(ws, 'checkout')).toEqual([])
  })

  test('a long cell is cut around the match, and hits stop at the limit', () => {
    const long = `${'a'.repeat(100)} needle ${'b'.repeat(100)}`
    insertRecord(ws, notes, { body: long })
    const [hit] = searchRecords(ws, 'needle')
    expect(hit?.snippet.startsWith('…')).toBe(true)
    expect(hit?.snippet.endsWith('…')).toBe(true)
    expect(hit?.snippet).toContain(' needle ')
    expect(hit?.title).toBe(long)
    for (let n = 0; n < 30; n++) insertRecord(ws, notes, { body: `hay ${n}` })
    expect(searchRecords(ws, 'hay')).toHaveLength(20)
    expect(searchRecords(ws, 'hay', 5)).toHaveLength(5)
  })
})
