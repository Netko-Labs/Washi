import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { openWorkspace, type Workspace } from '@washi/repository'
import { defineUserTable, runMutation, runQuery } from '../tables/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'expenses',
    columns: [
      { name: 'name', type: 'text' },
      { name: 'category', type: 'select', options: ['Health', 'Pets', 'Travel'] },
      { name: 'date', type: 'date' },
      { name: 'amount', type: 'number' },
      { name: 'month', type: 'formula', expr: 'month(date)' },
    ],
  })
  defineUserTable(ws, {
    name: 'categories',
    columns: [
      { name: 'name', type: 'text' },
      { name: 'budget', type: 'number' },
      {
        name: 'spent',
        type: 'rollup',
        rollup: {
          table: 'expenses',
          via: 'category',
          fn: 'sum',
          column: 'amount',
          where: [{ column: 'month', op: 'eq', value: { param: 'month' } }],
        },
      },
      {
        name: 'items',
        type: 'rollup',
        rollup: { table: 'expenses', via: 'category', fn: 'count' },
      },
      { name: 'left', type: 'formula', expr: 'budget - spent' },
    ],
  })
  const add = (table: string, data: Record<string, string | number>) =>
    runMutation(ws, { kind: 'insert', table, data })
  add('categories', { name: 'Health', budget: 2_000_000 })
  add('categories', { name: 'Pets', budget: 500_000 })
  add('categories', { name: 'Travel', budget: 1_000_000 })
  add('expenses', { name: 'Insurance', category: 'Health', date: '2026-10-01', amount: 1_200_000 })
  add('expenses', { name: 'Trainer', category: 'Health', date: '2026-10-05', amount: 680_000 })
  add('expenses', { name: 'Vet', category: 'Pets', date: '2026-11-02', amount: 300_000 })
})
afterEach(() => ws.close())

const byName = (rows: Record<string, unknown>[]) =>
  Object.fromEntries(rows.map((row) => [row.name, row]))

describe('rollups (D74)', () => {
  test('budget vs actual per category, for the month the page asks about', () => {
    const october = byName(runQuery(ws, { table: 'categories', params: { month: '2026-10' } }).rows)
    expect(october.Health).toMatchObject({ spent: 1_880_000, left: 120_000, items: 2 })
    expect(october.Pets).toMatchObject({ spent: 0, left: 500_000, items: 1 })
    expect(october.Travel).toMatchObject({ spent: 0, items: 0 })
  })

  test('an unset param drops its filter: all time', () => {
    const all = byName(runQuery(ws, { table: 'categories' }).rows)
    expect(all.Pets).toMatchObject({ spent: 300_000, left: 200_000 })
  })

  test('filter and order on a rollup; over budget is a question you can ask', () => {
    const over = runQuery(ws, {
      table: 'categories',
      params: { month: '2026-10' },
      where: [{ column: 'left', op: 'lt', value: 200_000 }],
      orderBy: { column: 'spent', direction: 'desc' },
    })
    expect(over.rows.map((row) => row.name)).toEqual(['Health'])
  })

  test('follows a relation by id, so a renamed category keeps its rows', () => {
    defineUserTable(ws, { name: 'projects', columns: [{ name: 'title', type: 'text' }] })
    runMutation(ws, { kind: 'insert', table: 'projects', data: { title: 'Launch' } })
    const projectId = String(runQuery(ws, { table: 'projects' }).rows[0]?.id)
    defineUserTable(ws, {
      name: 'tasks',
      columns: [
        { name: 'title', type: 'text' },
        { name: 'project', type: 'relation', table: 'projects' },
        { name: 'points', type: 'number' },
      ],
    })
    for (const points of [3, 5]) {
      runMutation(ws, {
        kind: 'insert',
        table: 'tasks',
        data: { title: 't', project: [projectId], points },
      })
    }
    defineUserTable(ws, {
      name: 'projects',
      columns: [
        { name: 'title', type: 'text' },
        {
          name: 'points',
          type: 'rollup',
          rollup: { table: 'tasks', via: 'project', fn: 'sum', column: 'points' },
        },
      ],
    })
    runMutation(ws, {
      kind: 'update',
      table: 'projects',
      where: [{ column: 'id', op: 'eq', value: projectId }],
      data: { title: 'Relaunch' },
    })
    expect(runQuery(ws, { table: 'projects' }).rows[0]).toMatchObject({
      title: 'Relaunch',
      points: 8,
    })
  })

  test('refused when it cannot work: no table, no column, a rollup of a rollup, a write', () => {
    const define = (rollup: Record<string, unknown>) =>
      defineUserTable(ws, {
        name: 'bad',
        columns: [
          { name: 'name', type: 'text' },
          { name: 'r', type: 'rollup', rollup },
        ],
      })
    expect(() => define({ table: 'nope', via: 'x', fn: 'count' })).toThrow('no table "nope"')
    expect(() => define({ table: 'expenses', via: 'nope', fn: 'count' })).toThrow(
      'has no column "nope"',
    )
    expect(() => define({ table: 'categories', via: 'name', fn: 'sum', column: 'spent' })).toThrow(
      'itself a rollup',
    )
    expect(() =>
      defineUserTable(ws, {
        name: 'bad_on',
        columns: [
          { name: 'name', type: 'text' },
          { name: 'key', type: 'formula', expr: 'name' },
          {
            name: 'r',
            type: 'rollup',
            rollup: { table: 'expenses', via: 'category', on: 'key', fn: 'count' },
          },
        ],
      }),
    ).toThrow('not a stored column to match on')
    expect(() =>
      runMutation(ws, { kind: 'insert', table: 'categories', data: { name: 'x', spent: 1 } }),
    ).toThrow('computed from the rows it rolls up')
  })

  test('a multi_select via counts its row toward every choice it holds', () => {
    defineUserTable(ws, {
      name: 'posts',
      columns: [
        { name: 'title', type: 'text' },
        { name: 'tags', type: 'multi_select', options: ['Health', 'Pets'] },
      ],
    })
    runMutation(ws, {
      kind: 'insert',
      table: 'posts',
      data: { title: 'a', tags: ['Health', 'Pets'] },
    })
    runMutation(ws, { kind: 'insert', table: 'posts', data: { title: 'b', tags: ['Pets'] } })
    defineUserTable(ws, {
      name: 'categories',
      columns: [
        { name: 'name', type: 'text' },
        { name: 'budget', type: 'number' },
        { name: 'posts', type: 'rollup', rollup: { table: 'posts', via: 'tags', fn: 'count' } },
      ],
    })
    const rows = byName(runQuery(ws, { table: 'categories' }).rows)
    expect(rows.Health).toMatchObject({ posts: 1 })
    expect(rows.Pets).toMatchObject({ posts: 2 })
  })
})
