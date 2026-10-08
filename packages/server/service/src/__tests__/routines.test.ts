import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { getRoutine, openWorkspace, type Workspace } from '@washi/repository'
import { isDue, RoutineBook, type RoutineRunner } from '../agents/routines'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'routines', path: ':memory:' })
})
afterEach(() => ws.close())

const at = (iso: string) => new Date(iso)

function fakeRunner() {
  const prompts: { sessionId: string; text: string }[] = []
  const patient: string[] = []
  const running = new Set<string>()
  const runner: RoutineRunner = {
    prompt: async (sessionId, text) => {
      prompts.push({ sessionId, text })
    },
    isRunning: (sessionId) => running.has(sessionId),
    waitLonger: (sessionId) => {
      patient.push(sessionId)
    },
  }
  return { runner, prompts, patient, running }
}

describe('a routine runs once a day, at or after its minute', () => {
  test('made before its minute, it runs today; made after, it waits for tomorrow', () => {
    const { runner } = fakeRunner()
    const book = new RoutineBook(ws, runner)
    const early = book.create(
      { title: 'early', prompt: 'p', minuteUtc: 7 * 60 },
      null,
      at('2026-10-08T06:00:00Z'),
    )
    const late = book.create(
      { title: 'late', prompt: 'p', minuteUtc: 7 * 60 },
      null,
      at('2026-10-08T09:00:00Z'),
    )
    const nine = at('2026-10-08T09:00:00Z')
    expect(isDue(early, nine)).toBe(true)
    expect(isDue(late, nine)).toBe(false)
    expect(isDue(late, at('2026-10-09T07:00:00Z'))).toBe(true)
  })

  test('tick runs each due routine once, in its own patient conversation', () => {
    const { runner, prompts, patient } = fakeRunner()
    const book = new RoutineBook(ws, runner)
    const routine = book.create(
      { title: 'Digest', prompt: 'summarise yesterday', minuteUtc: 2 * 60 },
      'user_juan',
      at('2026-10-08T01:00:00Z'),
    )
    expect(book.tick(at('2026-10-08T01:59:00Z'))).toEqual([])
    expect(book.tick(at('2026-10-08T02:00:00Z'))).toEqual([routine.id])
    expect(book.tick(at('2026-10-08T02:01:00Z'))).toEqual([])
    expect(prompts).toEqual([
      { sessionId: getRoutine(ws, routine.id)!.sessionId!, text: 'summarise yesterday' },
    ])
    expect(patient).toEqual([prompts[0]!.sessionId])
    // the next day it runs again, in the same conversation
    book.tick(at('2026-10-09T02:00:00Z'))
    expect(prompts[1]?.sessionId).toBe(prompts[0]?.sessionId)
  })

  test('a disabled routine never runs, and a busy conversation is not doubled up', () => {
    const { runner, prompts, running } = fakeRunner()
    const book = new RoutineBook(ws, runner)
    const off = book.create(
      { title: 'off', prompt: 'p', minuteUtc: 0 },
      null,
      at('2026-10-07T00:00:00Z'),
    )
    book.setEnabled(off.id, false)
    expect(book.tick(at('2026-10-08T12:00:00Z'))).toEqual([])

    const busy = book.create(
      { title: 'busy', prompt: 'p', minuteUtc: 0 },
      null,
      at('2026-10-07T00:00:00Z'),
    )
    book.run(busy.id, at('2026-10-08T00:00:00Z'))
    running.add(getRoutine(ws, busy.id)!.sessionId!)
    expect(book.run(busy.id, at('2026-10-08T00:01:00Z'))).toBe(false)
    expect(prompts).toHaveLength(1)
  })

  test('it is marked as run before it runs, so a crash cannot make it run twice', () => {
    const { runner } = fakeRunner()
    runner.prompt = async () => {
      throw new Error('boom')
    }
    const book = new RoutineBook(ws, runner)
    const routine = book.create(
      { title: 'r', prompt: 'p', minuteUtc: 0 },
      null,
      at('2026-10-07T00:00:00Z'),
    )
    book.tick(at('2026-10-08T00:00:00Z'))
    expect(getRoutine(ws, routine.id)?.lastRunDay).toBe('2026-10-08')
    expect(book.tick(at('2026-10-08T00:05:00Z'))).toEqual([])
  })
})
