import { describe, expect, test } from 'bun:test'
import { z } from 'zod'
import { mutationSchema, querySchema, tableSpecSchema, validateRecord } from '../index'

const tasks = tableSpecSchema.parse({
  name: 'tasks',
  columns: [
    { name: 'title', type: 'text' },
    { name: 'done', type: 'boolean' },
    { name: 'points', type: 'number' },
    { name: 'status', type: 'select', options: ['todo', 'doing', 'shipped'] },
    { name: 'due', type: 'date' },
  ],
})

describe('table specs', () => {
  test('rejects non-snake_case names', () => {
    expect(() => tableSpecSchema.parse({ name: 'My Tasks', columns: tasks.columns })).toThrow()
    expect(() =>
      tableSpecSchema.parse({ name: 'tasks', columns: [{ name: 'Title!', type: 'text' }] }),
    ).toThrow()
  })
})

describe('record validation', () => {
  test('accepts valid rows and nulls', () => {
    expect(
      validateRecord(tasks, { title: 'ship it', done: false, points: 3, status: 'todo' }),
    ).toEqual([])
    expect(validateRecord(tasks, { title: null })).toEqual([])
  })

  test('rejects wrong types, unknown columns, bad select values', () => {
    const issues = validateRecord(tasks, { title: 7, ghost: 'x', status: 'later', due: 'nope' })
    expect(issues.map((issue) => issue.path).sort()).toEqual(['due', 'ghost', 'status', 'title'])
  })
})

describe('descriptors', () => {
  test('query with filters, order, limit, aggregation parses', () => {
    const query = querySchema.parse({
      table: 'tasks',
      where: [{ column: 'status', op: 'eq', value: 'todo' }],
      orderBy: { column: 'points', direction: 'desc' },
      limit: 50,
      groupBy: { column: 'status', aggregates: [{ fn: 'count' }, { fn: 'sum', column: 'points' }] },
    })
    expect(query.groupBy?.aggregates).toHaveLength(2)
  })

  test('mutations parse and reject unfiltered updates', () => {
    expect(
      mutationSchema.parse({ kind: 'insert', table: 'tasks', data: { title: 'x' } }).kind,
    ).toBe('insert')
    expect(() =>
      mutationSchema.parse({ kind: 'update', table: 'tasks', where: [], data: { done: true } }),
    ).toThrow()
  })
})

const issues = tableSpecSchema.parse({
  name: 'issues',
  columns: [
    { name: 'title', type: 'text' },
    {
      name: 'state',
      type: 'status',
      groups: { todo: ['Backlog', 'Todo'], doing: ['In progress'], done: ['Done'] },
    },
    { name: 'labels', type: 'multi_select', options: ['bug', 'ui'] },
    { name: 'assignee', type: 'person' },
    { name: 'link', type: 'url' },
    { name: 'project', type: 'relation', table: 'projects' },
    { name: 'when', type: 'date' },
  ],
})

describe('Notion properties', () => {
  test('a status needs its groups; a relation needs its table', () => {
    expect(() =>
      tableSpecSchema.parse({ name: 'x', columns: [{ name: 's', type: 'status' }] }),
    ).toThrow()
    expect(() =>
      tableSpecSchema.parse({ name: 'x', columns: [{ name: 'r', type: 'relation' }] }),
    ).toThrow()
  })

  test('accepts each kind in its own shape', () => {
    expect(
      validateRecord(issues, {
        state: 'In progress',
        labels: ['bug', 'ui'],
        assignee: 'user_1',
        link: 'https://washi.netko.dev',
        project: ['rec_1'],
        when: '2026-10-01/2026-10-14',
      }),
    ).toEqual([])
  })

  test('refuses what does not fit', () => {
    const paths = (data: Parameters<typeof validateRecord>[1]) =>
      validateRecord(issues, data).map((issue) => issue.path)
    expect(paths({ state: 'Shipped' })).toEqual(['state'])
    expect(paths({ labels: 'bug' })).toEqual(['labels'])
    expect(paths({ labels: ['bug', 'bug'] })).toEqual(['labels'])
    expect(paths({ labels: ['perf'] })).toEqual(['labels'])
    expect(paths({ title: ['a'] })).toEqual(['title'])
    expect(paths({ link: 'javascript:alert(1)' })).toEqual(['link'])
    expect(paths({ when: '2026-10-14/2026-10-01' })).toEqual(['when'])
    expect(paths({ when: 'soon' })).toEqual(['when'])
  })
})

describe('the copy mutation (D76)', () => {
  const copy = {
    kind: 'copy',
    table: 'expenses',
    params: { month: '2026-11' },
    where: [{ column: 'next_month', op: 'eq', value: { param: 'month' } }],
    set: { date: { expr: 'next_date' }, paid: false },
  }

  test('parses with params, { param } filters and { expr } cells; set defaults to nothing', () => {
    expect(mutationSchema.safeParse(copy).success).toBe(true)
    const { set: _, ...bare } = copy
    expect(mutationSchema.parse(bare)).toMatchObject({ kind: 'copy', set: {} })
  })

  test('needs a where, and copies at most 500 rows', () => {
    expect(mutationSchema.safeParse({ ...copy, where: [] }).success).toBe(false)
    expect(mutationSchema.safeParse({ ...copy, limit: 500 }).success).toBe(true)
    expect(mutationSchema.safeParse({ ...copy, limit: 501 }).success).toBe(false)
    expect(mutationSchema.safeParse({ ...copy, params: { 'Bad Name': 1 } }).success).toBe(false)
  })

  test('the tool schema Washi is handed still converts to JSON Schema', () => {
    const json = JSON.stringify(z.toJSONSchema(z.object({ mutation: mutationSchema })))
    expect(json).toContain('"copy"')
    expect(json).toContain('"expr"')
  })
})
