import { describe, expect, test } from 'bun:test'
import { createBookHost, runHistory, runQuery, seedTables } from '../utils'

const tasks = () => seedTables().get('tasks')!

describe('memory executor', () => {
  test('filters, orders and limits', () => {
    const result = runQuery(tasks(), {
      table: 'tasks',
      where: [{ column: 'status', op: 'in', value: ['doing', 'review'] }],
      orderBy: { column: 'points', direction: 'desc' },
      limit: 2,
    })
    expect(result.rows.map((row) => row.points)).toEqual([8, 5])
  })

  test('groups with aggregates', () => {
    const result = runQuery(tasks(), {
      table: 'tasks',
      groupBy: { column: 'status', aggregates: [{ fn: 'sum', column: 'points' }, { fn: 'count' }] },
    })
    const done = result.rows.find((row) => row.status === 'done')
    expect(done).toMatchObject({ sum_points: 4, count: 2 })
  })

  test('history climbs to the matching count', () => {
    const result = runHistory(tasks(), { table: 'tasks', range: '7d' })
    expect(result.rows).toHaveLength(7)
    expect(result.rows.at(-1)?.count).toBe(7)
  })
})

describe('book host', () => {
  test('verbs land and listeners hear it', async () => {
    const said: string[] = []
    const host = createBookHost((message) => said.push(message))
    let heard = 0
    host.onDataChange?.(() => heard++)
    await host.runAction({
      verb: 'table.insert',
      table: 'tasks',
      data: { title: 'New', status: 'todo' },
    })
    await host.runAction({
      verb: 'table.update',
      table: 'tasks',
      row: 'tasks-1',
      set: { status: 'done' },
    })
    const rows = (await host.runQuery({ table: 'tasks' })).rows
    expect(rows).toHaveLength(8)
    expect(rows[0]?.status).toBe('done')
    expect(heard).toBe(2)
    await host.runAction({ verb: 'sheet.open', sheet: 'x' })
    expect(said.at(-1)).toContain('sheet.open')
  })
})

test("an Agenda event's copies land as rows of their own, each entry over the row", async () => {
  const host = createBookHost(() => {})
  await host.runAction({
    verb: 'table.copy',
    table: 'tasks',
    where: [{ column: 'id', op: 'eq', value: 'tasks-1' }],
    set: {},
    each: [{ due: '2026-11-04' }, { due: '2026-11-05' }],
  })
  const rows = (await host.runQuery({ table: 'tasks' })).rows
  const copies = rows.filter((row) => row.title === rows[0]?.title)
  expect(copies.map((row) => [row.id, row.due])).toEqual([
    ['tasks-1', rows[0]?.due ?? null],
    ['tasks-8', '2026-11-04'],
    ['tasks-9', '2026-11-05'],
  ])
  await expect(
    host.runAction({
      verb: 'table.copy',
      table: 'tasks',
      where: [{ column: 'id', op: 'eq', value: 'tasks-1' }],
      each: [{ due: '2026-11-06' }, { due: 'soon' }],
    }),
  ).rejects.toThrow()
  expect((await host.runQuery({ table: 'tasks' })).rows).toHaveLength(9)
})

test('a deleted row id is never reused', async () => {
  const host = createBookHost(() => {})
  await host.runAction({ verb: 'table.delete', table: 'tasks', row: 'tasks-7' })
  await host.runAction({ verb: 'table.insert', table: 'tasks', data: { title: 'Fresh' } })
  const ids = (await host.runQuery({ table: 'tasks' })).rows.map((row) => row.id)
  expect(ids).toContain('tasks-8')
  expect(ids).not.toContain('tasks-7')
})

test('an insert the server would refuse is refused here, in ink’s words', async () => {
  const host = createBookHost(() => {})
  await expect(
    host.runAction({ verb: 'table.insert', table: 'tasks', data: { points: 'many' } }),
  ).rejects.toThrow('points: expected a number')
})

describe('formulas in the book', () => {
  test('a formula column is computed over its row, as the server does, and can be aggregated', () => {
    const [table] = seedTables([
      {
        spec: {
          name: 'krs',
          columns: [
            { name: 'current', type: 'number' },
            { name: 'target', type: 'number' },
            { name: 'progress', type: 'formula', expr: 'current / target' },
          ],
        },
        rows: [
          { current: 3, target: 4 },
          { current: 1, target: 0 },
        ],
      },
    ]).values()
    if (!table) throw new Error('no table')
    expect(runQuery(table, { table: 'krs' }).rows.map((row) => row.progress)).toEqual([0.75, null])
  })
})
