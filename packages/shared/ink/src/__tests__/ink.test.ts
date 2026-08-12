import { describe, expect, test } from 'bun:test'
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
