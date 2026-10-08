import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { type RoutineCreate, routineCreateSchema } from '@washi/domain'
import { getRoutine, openWorkspace, type Workspace } from '@washi/repository'
import { isDue, RoutineBook, type RoutineRunner, zonedNow } from '../agents/routines'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'routines', path: ':memory:' })
})
afterEach(() => ws.close())

const at = (iso: string) => new Date(iso)
const UTC = 'UTC'
const make = (over: Partial<RoutineCreate> = {}): RoutineCreate => ({
  title: 'r',
  prompt: 'p',
  minuteOfDay: 7 * 60,
  timeZone: UTC,
  ...over,
})

function fakeRunner() {
  const prompts: { sessionId: string; text: string }[] = []
  const patient: string[] = []
  const running = new Set<string>()
  const budget = { open: true }
  const runner: RoutineRunner = {
    prompt: async (sessionId, text) => {
      prompts.push({ sessionId, text })
      running.add(sessionId)
    },
    isRunning: (sessionId) => running.has(sessionId),
    waitLonger: (sessionId) => {
      patient.push(sessionId)
    },
    canStart: () => budget.open,
  }
  return { runner, prompts, patient, running, budget }
}

describe('a routine runs once a day, at or after its minute, in its own zone', () => {
  test('made before its minute, it runs today; made after, it waits for tomorrow', () => {
    const book = new RoutineBook(ws, fakeRunner().runner)
    const early = book.create(make({ title: 'early' }), null, at('2026-10-08T06:00:00Z'))
    const late = book.create(make({ title: 'late' }), null, at('2026-10-08T09:00:00Z'))
    expect(isDue(early, at('2026-10-08T09:00:00Z'))).toBe(true)
    expect(isDue(late, at('2026-10-08T09:00:00Z'))).toBe(false)
    expect(isDue(late, at('2026-10-09T07:00:00Z'))).toBe(true)
  })

  test('07:00 in New York stays 07:00 across daylight saving', () => {
    const book = new RoutineBook(ws, fakeRunner().runner)
    const routine = book.create(
      make({ timeZone: 'America/New_York' }),
      null,
      at('2026-01-15T00:00:00Z'),
    )
    // winter: 07:00 EST is 12:00 UTC; summer: 07:00 EDT is 11:00 UTC
    expect(isDue(routine, at('2026-01-15T11:59:00Z'))).toBe(false)
    expect(isDue(routine, at('2026-01-15T12:00:00Z'))).toBe(true)
    expect(isDue(routine, at('2026-07-15T10:59:00Z'))).toBe(false)
    expect(isDue(routine, at('2026-07-15T11:00:00Z'))).toBe(true)
  })

  test("the day is the zone's day, not UTC's", () => {
    expect(zonedNow(at('2026-10-08T03:00:00Z'), 'America/Los_Angeles').day).toBe('2026-10-07')
    expect(zonedNow(at('2026-10-08T03:00:00Z'), 'Asia/Tokyo').day).toBe('2026-10-08')
  })

  test('resuming a paused routine after its minute waits for tomorrow', () => {
    const { runner, prompts } = fakeRunner()
    const book = new RoutineBook(ws, runner)
    const routine = book.create(make(), null, at('2026-10-07T06:00:00Z'))
    book.setEnabled(routine.id, false)
    book.setEnabled(routine.id, true, at('2026-10-08T15:00:00Z'))
    expect(book.tick(at('2026-10-08T15:01:00Z'))).toEqual([])
    expect(prompts).toEqual([])
  })
})

describe('routines can not outrun the daily stop', () => {
  test('due together, they start one at a time — the stop is checked between them', () => {
    const { runner, prompts, running } = fakeRunner()
    const book = new RoutineBook(ws, runner)
    for (const title of ['a', 'b', 'c'])
      book.create(make({ title }), null, at('2026-10-07T00:00:00Z'))
    const seven = at('2026-10-08T07:00:00Z')
    expect(book.tick(seven)).toHaveLength(1)
    expect(book.tick(seven)).toEqual([])
    running.clear()
    expect(book.tick(seven)).toHaveLength(1)
    running.clear()
    expect(book.tick(seven)).toHaveLength(1)
    expect(prompts.map((prompt) => prompt.text)).toHaveLength(3)
  })

  test('a parked run holds the rest — approved together, they would all pass the stop', () => {
    const { runner } = fakeRunner()
    const book = new RoutineBook(ws, runner)
    for (const title of ['a', 'b']) book.create(make({ title }), null, at('2026-10-07T00:00:00Z'))
    const seven = at('2026-10-08T07:00:00Z')
    expect(book.tick(seven)).toHaveLength(1)
    // still running (parked on a person, as far as the book knows) — nothing else starts
    expect(book.tick(at('2026-10-08T08:00:00Z'))).toEqual([])
  })

  test('Run now waits its turn too, and a double click starts one run', () => {
    const { runner, prompts } = fakeRunner()
    const book = new RoutineBook(ws, runner)
    const routine = book.create(make(), null, at('2026-10-07T00:00:00Z'))
    expect(book.run(routine.id)).toBe('started')
    expect(book.run(routine.id)).toBe('busy')
    expect(prompts).toHaveLength(1)
  })

  test('at the daily stop nothing is marked, and the day catches up after Resume', () => {
    const { runner, prompts, budget } = fakeRunner()
    const book = new RoutineBook(ws, runner)
    const routine = book.create(make(), null, at('2026-10-07T00:00:00Z'))
    budget.open = false
    expect(book.tick(at('2026-10-08T07:00:00Z'))).toEqual([])
    expect(getRoutine(ws, routine.id)?.lastRunDay).toBeNull()
    budget.open = true
    expect(book.tick(at('2026-10-08T09:00:00Z'))).toEqual([routine.id])
    expect(prompts).toHaveLength(1)
  })
})

describe('each run is its own conversation', () => {
  test('a new session every day, so day N never pays to re-read days 1..N-1', () => {
    const { runner, prompts, running } = fakeRunner()
    const book = new RoutineBook(ws, runner)
    const routine = book.create(make(), null, at('2026-10-07T00:00:00Z'))
    book.tick(at('2026-10-08T07:00:00Z'))
    running.clear()
    book.tick(at('2026-10-09T07:00:00Z'))
    expect(prompts[0]?.sessionId).not.toBe(prompts[1]?.sessionId)
    expect(getRoutine(ws, routine.id)?.sessionId).toBe(prompts[1]?.sessionId)
  })

  test('only a scheduled run waits all night; Run now has a person watching', () => {
    const { runner, prompts, patient, running } = fakeRunner()
    const book = new RoutineBook(ws, runner)
    const routine = book.create(make(), null, at('2026-10-07T00:00:00Z'))
    book.run(routine.id, at('2026-10-08T03:00:00Z'))
    expect(patient).toEqual([])
    running.clear()
    book.tick(at('2026-10-09T07:00:00Z'))
    expect(patient).toEqual([prompts[1]!.sessionId])
  })

  test('it is marked as run before it runs, so a crash cannot run it twice', () => {
    const { runner } = fakeRunner()
    runner.prompt = async () => {
      throw new Error('boom')
    }
    const book = new RoutineBook(ws, runner)
    const routine = book.create(make({ minuteOfDay: 0 }), null, at('2026-10-07T00:00:00Z'))
    book.tick(at('2026-10-08T00:00:00Z'))
    expect(getRoutine(ws, routine.id)?.lastRunDay).toBe('2026-10-08')
    expect(book.tick(at('2026-10-08T00:05:00Z'))).toEqual([])
  })
})

describe('a zone is stored the way every client will spell it', () => {
  test('aliases and case collapse to the canonical IANA name; nonsense is refused', () => {
    const parse = (timeZone: string) =>
      routineCreateSchema.safeParse({ title: 't', prompt: 'p', minuteOfDay: 0, timeZone })
    const utc = parse('utc')
    expect(utc.success && utc.data.timeZone).toBe('UTC')
    expect(parse('Mars/Olympus_Mons').success).toBe(false)
  })
})
