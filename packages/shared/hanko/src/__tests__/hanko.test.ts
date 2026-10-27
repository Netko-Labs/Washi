import { describe, expect, test } from 'bun:test'
import { checkAction, runAction } from '../index'

describe('hanko', () => {
  test('valid verbs parse', () => {
    expect(checkAction({ verb: 'sheet.open', sheet: 'abc' }).ok).toBe(true)
    expect(checkAction({ verb: 'table.insert', table: 'tasks', data: { title: 'x' } }).ok).toBe(
      true,
    )
    expect(checkAction({ verb: 'url.open', url: 'https://example.com' }).ok).toBe(true)
    const copy = {
      verb: 'table.copy',
      table: 'expenses',
      params: { month: '2026-11' },
      where: [{ column: 'next_month', op: 'eq', value: { param: 'month' } }],
      set: { date: { expr: 'next_date' }, paid: false },
    }
    expect(checkAction(copy).ok).toBe(true)
    expect(checkAction({ ...copy, where: [] }).ok).toBe(false)
    expect(checkAction({ ...copy, limit: 501 }).ok).toBe(false)
  })

  test('unknown verbs and bad payloads are refused with messages', () => {
    const unknown = checkAction({ verb: 'fs.delete', path: '/' })
    expect(unknown.ok).toBe(false)
    if (!unknown.ok) expect(unknown.issues[0]?.message).toContain('unknown action verb')

    expect(checkAction({ verb: 'url.open', url: 'http://insecure.dev' }).ok).toBe(false)
    expect(checkAction({ verb: 'sheet.open' }).ok).toBe(false)
    expect(checkAction(null).ok).toBe(false)
  })

  test('runAction dispatches to the matching handler', async () => {
    const opened: string[] = []
    await runAction(
      { verb: 'sheet.open', sheet: 's1' },
      {
        'sheet.open': (action) => {
          opened.push(action.sheet)
        },
        'sheet.create': () => {},
        'table.insert': () => {},
        'table.update': () => {},
        'table.reorder': () => {},
        'table.copy': () => {},
        'table.delete': () => {},
        'table.column': () => {},
        'url.open': () => {},
      },
    )
    expect(opened).toEqual(['s1'])
    await expect(
      runAction(
        { verb: 'nope' },
        {
          'sheet.open': () => {},
          'sheet.create': () => {},
          'table.insert': () => {},
          'table.update': () => {},
          'table.reorder': () => {},
          'table.copy': () => {},
          'table.delete': () => {},
          'table.column': () => {},
          'url.open': () => {},
        },
      ),
    ).rejects.toThrow('unknown action verb')
  })
})

describe('table.column', () => {
  test('reaches its handler', async () => {
    const added: string[] = []
    const noop = () => {}
    await runAction(
      { verb: 'table.column', table: 'issues', column: { name: 'due', type: 'date' } },
      {
        'sheet.open': noop,
        'sheet.create': noop,
        'table.insert': noop,
        'table.update': noop,
        'table.reorder': noop,
        'table.copy': noop,
        'table.delete': noop,
        'table.column': (action) => {
          added.push(action.column.name)
        },
        'url.open': noop,
      },
    )
    expect(added).toEqual(['due'])
  })
})
