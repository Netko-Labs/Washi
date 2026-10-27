import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { type ReminderCreate, reminderCreateSchema } from '@washi/domain'
import { openWorkspace, type Workspace } from '@washi/repository'
import {
  createReminderRule,
  markRemindersRead,
  ReminderError,
  reminderInbox,
  removeReminderRule,
  tickReminders,
  updateReminderRule,
} from '../reminders/service'
import { defineUserTable, InkError, runMutation } from '../tables/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'reminders', path: ':memory:' })
  defineUserTable(ws, {
    name: 'bills',
    columns: [
      { name: 'name', type: 'text' },
      { name: 'due', type: 'date' },
      { name: 'paid', type: 'boolean' },
      { name: 'owner', type: 'person' },
    ],
  })
  for (const [name, due, paid, owner] of [
    ['Water', '2026-10-29', false, 'ana'],
    ['Rent', '2026-10-27', false, 'ben'],
    ['Gym', '2026-10-28', true, 'ana'],
    ['Phone', '2026-11-20', false, 'ana'],
    ['Old', '2026-10-20', false, 'ana'],
  ] as const) {
    runMutation(ws, { kind: 'insert', table: 'bills', data: { name, due, paid, owner } })
  }
})
afterEach(() => ws.close())

const at = (iso: string) => new Date(iso)
const NOON = at('2026-10-27T12:00:00Z')
const rule = (over: Partial<ReminderCreate> = {}): ReminderCreate =>
  reminderCreateSchema.parse({
    title: 'Bills due',
    table: 'bills',
    dateColumn: 'due',
    daysBefore: 3,
    where: [{ column: 'paid', op: 'eq', value: false }],
    timeZone: 'UTC',
    ...over,
  })
const titles = (userId: string) =>
  reminderInbox(ws, userId)
    .items.map((hit) => hit.rowTitle)
    .sort()

describe('a reminder is a rule the clock evaluates (D77)', () => {
  test('each row reminds once per due date, not every minute', () => {
    createReminderRule(ws, rule(), null)
    expect(tickReminders(ws, NOON)).toBe(2)
    expect(tickReminders(ws, at('2026-10-27T12:01:00Z'))).toBe(0)
    expect(tickReminders(ws, at('2026-10-27T18:00:00Z'))).toBe(0)
    expect(titles('ana')).toEqual(['Rent', 'Water'])
  })

  test('days before is the window: today through that many days ahead', () => {
    createReminderRule(ws, rule({ daysBefore: 0 }), null)
    tickReminders(ws, NOON)
    expect(titles('ana')).toEqual(['Rent'])
  })

  test('where filters the rows: a paid bill stays quiet', () => {
    createReminderRule(ws, rule({ where: [] }), null)
    tickReminders(ws, NOON)
    expect(titles('ana')).toEqual(['Gym', 'Rent', 'Water'])
  })

  test('the day is the zone’s: late on the 26th in Bogotá is already the 27th in UTC', () => {
    createReminderRule(ws, rule({ daysBefore: 0, timeZone: 'America/Bogota' }), null)
    expect(tickReminders(ws, at('2026-10-27T03:00:00Z'))).toBe(0)
    expect(tickReminders(ws, at('2026-10-27T05:00:00Z'))).toBe(1)
  })

  test('a moved due date reminds again', () => {
    createReminderRule(ws, rule({ daysBefore: 0 }), null)
    tickReminders(ws, NOON)
    runMutation(ws, {
      kind: 'update',
      table: 'bills',
      where: [{ column: 'name', op: 'eq', value: 'Rent' }],
      data: { due: '2026-11-27' },
    })
    expect(tickReminders(ws, at('2026-11-27T09:00:00Z'))).toBe(1)
    expect(reminderInbox(ws, 'ana').items.map((hit) => hit.dueDay)).toEqual([
      '2026-11-27',
      '2026-10-27',
    ])
  })

  test('a person column sends each row only to the member it names', () => {
    createReminderRule(ws, rule({ personColumn: 'owner' }), null)
    tickReminders(ws, NOON)
    expect(titles('ana')).toEqual(['Water'])
    expect(titles('ben')).toEqual(['Rent'])
    expect(titles('cy')).toEqual([])
  })

  test('read is per person', () => {
    createReminderRule(ws, rule(), null)
    tickReminders(ws, NOON)
    const [first] = reminderInbox(ws, 'ana').items
    markRemindersRead(ws, 'ana', [first?.id ?? ''])
    expect(reminderInbox(ws, 'ana').unread).toBe(1)
    expect(reminderInbox(ws, 'ben').unread).toBe(2)
    markRemindersRead(ws, 'ana')
    expect(reminderInbox(ws, 'ana').unread).toBe(0)
    expect(reminderInbox(ws, 'ana').items.every((hit) => hit.isRead)).toBe(true)
  })

  test('a disabled reminder is silent; a removed one takes its hits', () => {
    const reminder = createReminderRule(ws, rule(), null)
    updateReminderRule(ws, { id: reminder.id, enabled: false })
    expect(tickReminders(ws, NOON)).toBe(0)
    updateReminderRule(ws, { id: reminder.id, enabled: true })
    expect(tickReminders(ws, NOON)).toBe(2)
    removeReminderRule(ws, reminder.id)
    expect(reminderInbox(ws, 'ana').items).toEqual([])
  })

  test('a deleted row takes its hit out of the Inbox', () => {
    createReminderRule(ws, rule(), null)
    tickReminders(ws, NOON)
    runMutation(ws, {
      kind: 'delete',
      table: 'bills',
      where: [{ column: 'name', op: 'eq', value: 'Water' }],
    })
    expect(titles('ana')).toEqual(['Rent'])
  })

  test('a table or column gone later does not stop the clock', () => {
    createReminderRule(ws, rule({ title: 'broken' }), null)
    defineUserTable(ws, {
      name: 'bills',
      columns: [
        { name: 'name', type: 'text' },
        { name: 'due', type: 'text' },
      ],
    })
    defineUserTable(ws, {
      name: 'tasks',
      columns: [
        { name: 'name', type: 'text' },
        { name: 'due', type: 'date' },
        { name: 'paid', type: 'boolean' },
      ],
    })
    runMutation(ws, {
      kind: 'insert',
      table: 'tasks',
      data: { name: 'Ship', due: '2026-10-28', paid: false },
    })
    createReminderRule(ws, rule({ table: 'tasks' }), null)
    expect(tickReminders(ws, NOON)).toBe(1)
  })
})

describe('a rule is checked when it is saved', () => {
  test('the table, a date column, a person column and filters that exist', () => {
    expect(() => createReminderRule(ws, rule({ table: 'nope' }), null)).toThrow(ReminderError)
    expect(() => createReminderRule(ws, rule({ dateColumn: 'name' }), null)).toThrow(ReminderError)
    expect(() => createReminderRule(ws, rule({ personColumn: 'name' }), null)).toThrow(
      ReminderError,
    )
    expect(() =>
      createReminderRule(ws, rule({ where: [{ column: 'ghost', op: 'eq', value: 1 }] }), null),
    ).toThrow(InkError)
  })

  test('days before is 0 to 60', () => {
    expect(() => rule({ daysBefore: 61 })).toThrow()
    expect(() => rule({ daysBefore: -1 })).toThrow()
  })
})
