import { describe, expect, test } from 'bun:test'
import type { TodayTurn } from '../../today'
import type { InboxRow } from '../lib'
import { dayLabel, groupByDay, matchesFilter, turnRow, whenLabel } from '../lib'

const HOUR = 3_600_000
const DAY = 24 * HOUR
// A Wednesday at 15:00 local time.
const now = new Date(2026, 9, 21, 15, 0, 0).getTime()

const row = (id: string, at: number, kind: InboxRow['kind'] = 'washi'): InboxRow => ({
  id,
  kind,
  at,
  who: null,
  verb: '',
  where: null,
  detail: null,
})

describe('inbox time', () => {
  test('day labels read like a person says them', () => {
    expect(dayLabel(now - HOUR, now)).toBe('Today')
    expect(dayLabel(now - DAY, now)).toBe('Yesterday')
    expect(dayLabel(now - 2 * DAY, now)).toBe('Monday')
    expect(dayLabel(now - 8 * DAY, now)).toBe('Tue 13 Oct')
  })

  test('the time on the right counts up, then tells the time, then the day', () => {
    expect(whenLabel(now - 10_000, now)).toBe('now')
    expect(whenLabel(now - 25 * 60_000, now)).toBe('25 min')
    expect(whenLabel(now - 3 * HOUR, now)).toBe('3 h')
    expect(whenLabel(now - 7 * HOUR, now)).toBe('08:00')
    expect(whenLabel(now - DAY, now)).toBe('Tue')
  })
})

describe('inbox list', () => {
  test('newest first, cut by day', () => {
    const groups = groupByDay(
      [row('old', now - 2 * DAY), row('new', now - 1000), row('today', now - HOUR)],
      now,
    )
    expect(groups.map((group) => group.label)).toEqual(['Today', 'Monday'])
    expect(groups[0]?.rows.map((each) => each.id)).toEqual(['new', 'today'])
  })

  test('filters: needs shows no rows, the rest match the kind', () => {
    const mention = row('m', now, 'mention')
    expect(matchesFilter(mention, 'all')).toBe(true)
    expect(matchesFilter(mention, 'needs')).toBe(false)
    expect(matchesFilter(mention, 'mentions')).toBe(true)
    expect(matchesFilter(mention, 'washi')).toBe(false)
  })
})

describe('a turn in the inbox says what Washi did', () => {
  const turn = (outcome: TodayTurn['outcome'], receipt: TodayTurn['receipt']): TodayTurn => ({
    sessionId: 's1',
    sessionTitle: 'Trip planning',
    prompt: 'plan **Kyoto** with `dates`',
    tools: [],
    outcome,
    receipt,
    at: now,
  })
  const done = { kind: 'turn_done', stopReason: 'end_turn' } as const

  test('the page it wrote, else the line it said — never the ask', () => {
    const made = turnRow(turn({ kind: 'page', touch: 'made', id: 'p1', title: 'Kyoto' }, done))
    expect(made).toMatchObject({ verb: 'made', where: 'Kyoto', detail: null })
    const changed = turnRow(
      turn({ kind: 'page', touch: 'changed', id: 'p1', title: 'Kyoto' }, done),
    )
    expect(changed.verb).toBe('updated')
    const reply = turnRow(turn({ kind: 'reply', text: 'Three days fit.' }, done))
    expect(reply).toMatchObject({ verb: 'replied “Three days fit.”', where: null })
    const trashed = turnRow(
      turn({ kind: 'table', touch: 'trashed', id: 't1', name: 'issues' }, done),
    )
    expect(trashed).toMatchObject({
      verb: 'moved the table “issues” to the trash',
      where: null,
    })
  })

  test('nothing to show reads how it ended, in its chat', () => {
    const stopped = turnRow(turn(null, { kind: 'turn_done', stopReason: 'cancelled' }))
    expect(stopped).toMatchObject({ verb: 'was stopped in', where: 'Trip planning' })
    const failed = turnRow(turn(null, { kind: 'turn_done', stopReason: 'error', error: 'no key' }))
    expect(failed).toMatchObject({ where: 'Trip planning', detail: 'no key' })
  })
})
