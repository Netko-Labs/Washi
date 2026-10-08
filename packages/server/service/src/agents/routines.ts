import type { Routine, RoutineCreate } from '@washi/domain'
import {
  createRoutine,
  createSession,
  deleteRoutine,
  getRoutine,
  listRoutines,
  listSessions,
  updateRoutine,
  type Workspace,
} from '@washi/repository'

export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10)
}

export function utcMinute(now: Date): number {
  return now.getUTCHours() * 60 + now.getUTCMinutes()
}

/** Once a day, at or after its minute, and never twice on the same UTC day. */
export function isDue(routine: Routine, now: Date): boolean {
  return (
    routine.enabled && routine.lastRunDay !== utcDay(now) && utcMinute(now) >= routine.minuteUtc
  )
}

export interface RoutineRunner {
  prompt(sessionId: string, text: string): Promise<void>
  isRunning(sessionId: string): boolean
  waitLonger(sessionId: string): void
}

/**
 * Prompts Washi runs on its own. A run is an ordinary turn — the daily stop, the
 * desk and the receipt all apply — in the routine's own conversation, so Today
 * retells it like any other.
 */
export class RoutineBook {
  private readonly ws: Workspace
  private readonly runner: RoutineRunner

  constructor(ws: Workspace, runner: RoutineRunner) {
    this.ws = ws
    this.runner = runner
  }

  list(): Routine[] {
    return listRoutines(this.ws)
  }

  /** A routine made after today's minute starts tomorrow, not the moment it is saved. */
  create(input: RoutineCreate, actorId: string | null, now = new Date()): Routine {
    const passed = utcMinute(now) >= input.minuteUtc
    return createRoutine(this.ws, {
      ...input,
      createdBy: actorId,
      lastRunDay: passed ? utcDay(now) : null,
    })
  }

  setEnabled(id: string, enabled: boolean): Routine | null {
    return updateRoutine(this.ws, id, { enabled })
  }

  remove(id: string): void {
    deleteRoutine(this.ws, id)
  }

  /** Every due routine, once. Called by the server's clock; never by a request. */
  tick(now = new Date()): string[] {
    return this.list()
      .filter((routine) => isDue(routine, now))
      .flatMap((routine) => (this.run(routine.id, now) ? [routine.id] : []))
  }

  /** Marked before it runs, so a crash mid-turn never makes it run twice. */
  run(id: string, now = new Date()): boolean {
    const routine = getRoutine(this.ws, id)
    if (!routine) return false
    const sessionId = this.sessionFor(routine)
    if (this.runner.isRunning(sessionId)) return false
    updateRoutine(this.ws, id, { lastRunDay: utcDay(now), sessionId })
    this.runner.waitLonger(sessionId)
    void this.runner.prompt(sessionId, routine.prompt).catch((error) => {
      console.error(`[washi] routine "${routine.title}" failed to start`, error)
    })
    return true
  }

  private sessionFor(routine: Routine): string {
    const known = routine.sessionId
      ? listSessions(this.ws).find((session) => session.id === routine.sessionId)
      : undefined
    return known?.id ?? createSession(this.ws, `Routine · ${routine.title}`).id
  }
}
