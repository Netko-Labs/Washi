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
