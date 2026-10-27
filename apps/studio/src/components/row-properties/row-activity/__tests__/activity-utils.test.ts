import { describe, expect, test } from 'bun:test'
import type { RowChange } from '@washi/domain'
import type { PhraseContext } from '../lib/types'
import { activityByDay } from '../lib/utils'

const NOW = new Date(2026, 10, 3, 18).getTime()
const context: PhraseContext = {
  spec: {
    name: 'bills',
    columns: [
      { name: 'name', type: 'text' },
      { name: 'paid', type: 'boolean' },
      { name: 'amount', type: 'number' },
      { name: 'rank', type: 'number' },
      { name: 'owner', type: 'person' },
    ],
  },
  people: [{ id: 'juan', name: 'Juan' }],
  related: {},
}
const change = (atMs: number, by: string | null, fields: RowChange['fields']): RowChange => ({
  atMs,
  by,
  kind: 'edited',
  fields,
})

describe('a row activity reads in words', () => {
  test('ticks, sets and clears; grouped by day, newest first', () => {
    const days = activityByDay(
      [
        change(new Date(2026, 10, 3, 9).getTime(), 'juan', [
          { column: 'paid', from: false, to: true },
        ]),
        change(new Date(2026, 9, 28, 9).getTime(), 'washi', [
          { column: 'amount', from: 30000, to: 32500 },
          { column: 'owner', from: null, to: 'juan' },
        ]),
        change(new Date(2026, 9, 28, 8).getTime(), null, [{ column: 'name', from: 'W', to: null }]),
      ],
      context,
      NOW,
    )
    expect(days.map((day) => day.label)).toEqual(['Today', 'Oct 28'])
    expect(days[0]?.entries.map((entry) => `${entry.who} ${entry.what}`)).toEqual([
      'Juan ticked paid',
    ])
    expect(days[1]?.entries.map((entry) => `${entry.who} ${entry.what}`)).toEqual([
      `Washi set amount ${(30000).toLocaleString()} → ${(32500).toLocaleString()}, set owner to Juan`,
      'Someone cleared name',
    ])
  })

  test('a reorder alone is not activity', () => {
    const moved = change(NOW, 'juan', [{ column: 'rank', from: 1, to: 2 }])
    expect(activityByDay([moved], context, NOW)).toEqual([])
  })
})
