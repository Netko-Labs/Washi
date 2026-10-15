import type { Routine, RoutineCreate } from '@washi/domain'
import {
  createRoutine,
  createSession,
  deleteRoutine,
  getRoutine,
  listRoutines,
  updateRoutine,
  type Workspace,
} from '@washi/repository'

/** The wall clock in a zone: which day it is there, and how far into it. */
export function zonedNow(now: Date, timeZone: string): { day: string; minute: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  )
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    minute: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

/** Once a day in its own zone, at or after its minute. */
export function isDue(routine: Routine, now: Date): boolean {
  if (!routine.enabled) return false
  const { day, minute } = zonedNow(now, routine.timeZone)
  return routine.lastRunDay !== day && minute >= routine.minuteOfDay
}

/** Today counts as run when its minute has already passed: nothing fires on save or resume. */
export function alreadyPassed(minuteOfDay: number, timeZone: string, now: Date): string | null {
  const { day, minute } = zonedNow(now, timeZone)
  return minute >= minuteOfDay ? day : null
}

export type RunOutcome = 'started' | 'busy' | 'stopped' | 'missing'

export interface RoutineRunner {
  prompt(sessionId: string, text: string): Promise<void>
  isRunning(sessionId: string): boolean
  waitLonger(sessionId: string): void
  /** Whether the daily stop would let a turn start right now. */
  canStart(): boolean
}

/**
 * Prompts Washi runs on its own. A run is an ordinary turn — the daily stop, the
 * desk and the receipt all apply — in a fresh conversation, so day N never pays
 * to re-read days 1 to N-1. Today retells it by its title.
 */
export class RoutineBook {
  private readonly ws: Workspace
  private readonly runner: RoutineRunner
  /** Sessions of runs this book started that may still be going. */
  private readonly inFlight = new Set<string>()

  constructor(ws: Workspace, runner: RoutineRunner) {
    this.ws = ws
    this.runner = runner
  }

  list(): Routine[] {
    return listRoutines(this.ws)
  }

  create(input: RoutineCreate, actorId: string | null, now = new Date()): Routine {
    return createRoutine(this.ws, {
      ...input,
      createdBy: actorId,
      lastRunDay: alreadyPassed(input.minuteOfDay, input.timeZone, now),
    })
  }

  setEnabled(id: string, enabled: boolean, now = new Date()): Routine | null {
    const routine = getRoutine(this.ws, id)
    if (!routine) return null
    const resumedLate = enabled && !routine.enabled
    const skip = resumedLate ? alreadyPassed(routine.minuteOfDay, routine.timeZone, now) : null
    return updateRoutine(this.ws, id, { enabled, ...(skip ? { lastRunDay: skip } : {}) })
  }

  remove(id: string): void {
    deleteRoutine(this.ws, id)
  }

  /**
   * Called by the server's clock, never by a request. One routine at a time,
   * parked ones included: the daily stop is checked when a turn starts and
   * charged when it ends, so runs approved together in the morning would all
   * pass it at once. A parked run holds the rest until someone answers it.
   */
  tick(now = new Date()): string[] {
    const due = this.list().find((routine) => isDue(routine, now))
    return due && this.run(due.id, now, { scheduled: true }) === 'started' ? [due.id] : []
  }

  /**
   * Marked before it runs, so a crash mid-turn never makes it run twice. Not
   * marked when it cannot start: a paused workspace catches up after Resume
   * instead of burning every routine's day on a refusal.
   */
  run(id: string, now = new Date(), { scheduled = false } = {}): RunOutcome {
    const routine = getRoutine(this.ws, id)
    if (!routine) return 'missing'
    for (const sessionId of this.inFlight) {
      if (!this.runner.isRunning(sessionId)) this.inFlight.delete(sessionId)
    }
    if (this.inFlight.size > 0) return 'busy'
    if (!this.runner.canStart()) return 'stopped'
    const sessionId = createSession(this.ws, `Routine · ${routine.title}`).id
    updateRoutine(this.ws, id, {
      lastRunDay: zonedNow(now, routine.timeZone).day,
      sessionId,
    })
    // Only an unattended run waits for the morning; Run now has a person watching.
    if (scheduled) this.runner.waitLonger(sessionId)
    this.inFlight.add(sessionId)
    void this.runner.prompt(sessionId, routine.prompt).catch((error) => {
      console.error(`[washi] routine "${routine.title}" failed to start`, error)
    })
    return 'started'
  }
}
