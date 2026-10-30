import { describe, expect, test } from 'bun:test'
import type { Suggestion } from '@washi/domain'
import { detailOf, rowOf, whenWords } from '../lib/utils'

const BOOKING: Suggestion = {
  id: 's1',
  sheetId: 'p1',
  sheetTitle: 'Book a call',
  tableName: 'appts',
  kind: 'booking',
  dateColumn: 'when',
  cells: { title: 'Intro', when: '2026-11-03T10:00/2026-11-03T10:30', notes: 'About pricing' },
  visitorName: 'Ana Ruiz',
  visitorEmail: 'ana@x.com',
  status: 'pending',
  hlcCreated: '00001761800000000-0000-dev',
  isRead: false,
}

const noop = async () => undefined

describe('a suggestion in the Inbox (D120)', () => {
  test('a booking reads its time first, then what was filled in', () => {
    expect(whenWords('2026-11-03T10:00/2026-11-03T10:30')).toBe('Tue 3 Nov 10:00')
    expect(detailOf(BOOKING)).toBe('Tue 3 Nov 10:00 · Intro · About pricing')
  })

  test('says who, where, and offers Approve and Decline', () => {
    const row = rowOf(BOOKING, { open: () => undefined, approve: noop, decline: noop })
    expect(row.who).toBe('Ana Ruiz (ana@x.com)')
    expect(row.verb).toBe('suggested a booking on')
    expect(row.where).toBe('Book a call')
    expect(row.actions?.map((action) => action.label)).toEqual(['Approve', 'Decline'])
  })
})
