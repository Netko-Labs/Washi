import { describe, expect, test } from 'bun:test'
import { checkAction, runAction } from '../index'

describe('hanko', () => {
  test('valid verbs parse', () => {
    expect(checkAction({ verb: 'sheet.open', sheet: 'abc' }).ok).toBe(true)
    expect(checkAction({ verb: 'table.insert', table: 'tasks', data: { title: 'x' } }).ok).toBe(
      true,
    )
    expect(checkAction({ verb: 'url.open', url: 'https://example.com' }).ok).toBe(true)
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
          'url.open': () => {},
        },
      ),
    ).rejects.toThrow('unknown action verb')
  })
})
