import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { getSheet, listSheets, openWorkspace, type Workspace } from '@washi/repository'
import { openRowPage, rowOfSheet } from '../tables/rows'
import { defineUserTable, deleteRecord, runMutation, updateRecord } from '../tables/service'

let ws: Workspace
let project: string
let issue: string
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, { name: 'projects', columns: [{ name: 'name', type: 'text' }] })
  project = runMutation(ws, { kind: 'insert', table: 'projects', data: { name: 'Ship' } }).id ?? ''
  defineUserTable(ws, {
    name: 'issues',
    columns: [
      { name: 'points', type: 'number' },
      { name: 'title', type: 'text' },
      { name: 'project', type: 'relation', table: 'projects' },
    ],
  })
  issue =
    runMutation(ws, {
      kind: 'insert',
      table: 'issues',
      data: { title: 'Fix login', points: 3, project: [project] },
    }).id ?? ''
})
afterEach(() => ws.close())

describe('every row is a page', () => {
  test('opening a row makes its page once, titled by its first text column', () => {
    const id = openRowPage(ws, issue)
    expect(openRowPage(ws, issue)).toBe(id)
    expect(getSheet(ws, id)).toMatchObject({ title: 'Fix login', rowOf: issue, parentId: null })
  })

  test("the page's title follows the row", () => {
    const id = openRowPage(ws, issue)
    updateRecord(ws, 'issues', issue, { title: 'Fix sign-in' })
    expect(getSheet(ws, id)?.title).toBe('Fix sign-in')
    runMutation(ws, {
      kind: 'update',
      table: 'issues',
      where: [{ column: 'id', op: 'eq', value: issue }],
      data: { title: 'Fix SSO' },
    })
    expect(getSheet(ws, id)?.title).toBe('Fix SSO')
  })

  test('the page knows its row, and the names its relations point at', () => {
    const id = openRowPage(ws, issue)
    expect(rowOfSheet(ws, id)).toMatchObject({
      table: { name: 'issues' },
      row: { id: issue, title: 'Fix login', points: 3 },
      related: { [project]: 'Ship' },
    })
  })

  test('a deleted row takes its page to the Trash; an ordinary page has no row', () => {
    const id = openRowPage(ws, issue)
    deleteRecord(ws, 'issues', issue)
    expect(listSheets(ws).some((sheet) => sheet.id === id)).toBe(false)
    expect(rowOfSheet(ws, id)).toBeNull()
  })
})
