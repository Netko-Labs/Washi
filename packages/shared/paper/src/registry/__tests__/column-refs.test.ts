import { describe, expect, test } from 'bun:test'
import { parse, type WsxElement } from '@washi/wsx'
import { namesColumn } from '../index'

const page = (body: string): WsxElement => parse(`<Sheet>${body}</Sheet>`)

describe('namesColumn', () => {
  test('a Database view names a column by groupBy, columns, date, cover or end', () => {
    const root = page(
      `<Database table="issues" views={[{ kind: 'board', groupBy: 'kind' }, { kind: 'table', columns: ['title', 'due'] }]} />`,
    )
    expect(namesColumn(root, 'issues', 'kind')).toBe(true)
    expect(namesColumn(root, 'issues', 'due')).toBe(true)
    expect(namesColumn(root, 'issues', 'owner')).toBe(false)
  })

  test("a bind's where and orderBy, and a primitive's own props, name it", () => {
    const root = page(
      `<Board bind={{ table: 'tasks', where: [{ column: 'stage', op: 'eq', value: 'x' }], orderBy: [{ column: 'rank' }] }} groupBy="status" title="name" />`,
    )
    for (const column of ['stage', 'rank', 'status', 'name']) {
      expect(namesColumn(root, 'tasks', column)).toBe(true)
    }
    expect(namesColumn(root, 'tasks', 'points')).toBe(false)
  })

  test('$row.<column> under a bound element names it, a longer name does not', () => {
    const root = page(`<Repeat bind="tasks"><Text>Due {'$row.due'}</Text></Repeat>`)
    expect(namesColumn(root, 'tasks', 'due')).toBe(true)
    expect(namesColumn(root, 'tasks', 'du')).toBe(false)
  })

  test('only elements over that table count, and the table name itself is not a column', () => {
    const root = page(`<Board bind="tasks" groupBy="kind" /><Board bind="other" groupBy="stage" />`)
    expect(namesColumn(root, 'tasks', 'stage')).toBe(false)
    expect(namesColumn(root, 'other', 'stage')).toBe(true)
    expect(namesColumn(root, 'tasks', 'tasks')).toBe(false)
    expect(namesColumn(root, 'missing', 'kind')).toBe(false)
  })

  test("an object bind's own table is not a column of the same name", () => {
    const root = page(`<Board bind={{ table: 'tasks', where: [] }} groupBy="kind" />`)
    expect(namesColumn(root, 'tasks', 'tasks')).toBe(false)
    expect(namesColumn(root, 'tasks', 'kind')).toBe(true)
  })
})
