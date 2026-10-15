import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { openWorkspace, type Workspace } from '@washi/repository'
import { CapabilityDesk } from '../agents/desk'
import { defineUserTable, InkError, runMutation, runQuery, updateRecord } from '../tables/service'

let ws: Workspace
let ship: string
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, { name: 'projects', columns: [{ name: 'name', type: 'text' }] })
  ship = runMutation(ws, { kind: 'insert', table: 'projects', data: { name: 'Ship' } }).id ?? ''
  defineUserTable(ws, {
    name: 'issues',
    columns: [
      { name: 'title', type: 'text' },
      {
        name: 'state',
        type: 'status',
        groups: { todo: ['Todo'], doing: ['Doing'], done: ['Done'] },
      },
      { name: 'labels', type: 'multi_select', options: ['bug', 'ui', 'perf'] },
      { name: 'project', type: 'relation', table: 'projects' },
    ],
  })
  for (const [title, labels] of [
    ['crash', ['bug']],
    ['button', ['bug', 'ui']],
    ['slow', ['perf']],
  ] as const) {
    runMutation(ws, {
      kind: 'insert',
      table: 'issues',
      data: { title, state: 'Todo', labels: [...labels], project: [ship] },
    })
  }
})
afterEach(() => ws.close())

const titles = (where: Parameters<typeof runQuery>[1]['where']) =>
  runQuery(ws, { table: 'issues', where })
    .rows.map((row) => row.title)
    .sort()

describe('a database, Notion-style', () => {
  test('a list cell comes back as a list', () => {
    const [row] = runQuery(ws, {
      table: 'issues',
      where: [{ column: 'title', op: 'eq', value: 'button' }],
    }).rows
    expect(row).toMatchObject({ labels: ['bug', 'ui'], project: [ship] })
  })

  test('list filters ask about membership', () => {
    expect(titles([{ column: 'labels', op: 'contains', value: 'bug' }])).toEqual([
      'button',
      'crash',
    ])
    expect(titles([{ column: 'labels', op: 'in', value: ['ui', 'perf'] }])).toEqual([
      'button',
      'slow',
    ])
    expect(titles([{ column: 'labels', op: 'ne', value: 'bug' }])).toEqual(['slow'])
    expect(() => titles([{ column: 'labels', op: 'gt', value: 'a' }])).toThrow(InkError)
  })

  test('a list does not group; a status does', () => {
    expect(() =>
      runQuery(ws, {
        table: 'issues',
        groupBy: { column: 'labels', aggregates: [{ fn: 'count' }] },
      }),
    ).toThrow(InkError)
    const groups = runQuery(ws, {
      table: 'issues',
      groupBy: { column: 'state', aggregates: [{ fn: 'count' }] },
    }).rows
    expect(groups).toEqual([{ state: 'Todo', count: 3 }])
  })

  test('a relation names live records of its table, and only those', () => {
    const [issue] = runQuery(ws, { table: 'issues', limit: 1 }).rows
    const id = String(issue?.id)
    expect(() => updateRecord(ws, 'issues', id, { project: ['nope'] })).toThrow(InkError)
    expect(() => updateRecord(ws, 'issues', id, { project: [id] })).toThrow(InkError)
    expect(() => updateRecord(ws, 'issues', id, { project: [] })).not.toThrow()
  })

  test('a relation must point at a table that exists', () => {
    expect(() =>
      defineUserTable(ws, {
        name: 'tasks',
        columns: [{ name: 'epic', type: 'relation', table: 'epics' }],
      }),
    ).toThrow(InkError)
    expect(() =>
      defineUserTable(ws, {
        name: 'tasks',
        columns: [{ name: 'parent', type: 'relation', table: 'tasks' }],
      }),
    ).not.toThrow()
  })

  test('a property added from the header joins the spec; a taken name is refused', async () => {
    const desk = new CapabilityDesk(ws, () => null)
    const add = (name: string) =>
      desk.execute(
        { verb: 'table.column', table: 'issues', column: { name, type: 'date' } },
        { origin: 'sheet' },
      )
    await add('due')
    const [row] = runQuery(ws, { table: 'issues', limit: 1 }).rows
    expect(row).toHaveProperty('due')
    expect(add('due')).rejects.toThrow(InkError)
  })
})
