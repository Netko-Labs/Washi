import type { RoutineRun } from '@washi/domain'

/** A routine run joined to its chat, as `listRoutineRuns` reads it. */
export interface RunRow {
  id: string
  routineId: string
  sessionId: string
  trigger: RoutineRun['trigger']
  startedAt: string
  sessionStatus: string | null
  costUsd: number | null
  endedAt: string | null
  waiting: number
}
