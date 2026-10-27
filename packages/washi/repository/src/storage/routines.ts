import type { Routine, RoutineRun } from '@washi/domain'
import { routineRunTable, routineTable } from '@washi/domain/db'
import { asc, eq } from 'drizzle-orm'
import { newId, type Workspace } from './client'

type RoutineRow = typeof routineTable.$inferSelect

function toRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    cron: row.cron ?? '0 0 * * *',
    minuteOfDay: row.minuteOfDay,
    timeZone: row.timeZone,
    enabled: row.enabled,
    lastRunAt: row.lastRunAt,
    sessionId: row.sessionId,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  }
}

export function listRoutines(ws: Workspace): Routine[] {
  return ws.db
    .select()
    .from(routineTable)
    .orderBy(asc(routineTable.minuteOfDay), asc(routineTable.createdAt))
    .all()
    .map(toRoutine)
}

export function getRoutine(ws: Workspace, id: string): Routine | null {
  const row = ws.db.select().from(routineTable).where(eq(routineTable.id, id)).get()
  return row ? toRoutine(row) : null
}

export function createRoutine(
  ws: Workspace,
  input: Pick<Routine, 'title' | 'prompt' | 'cron' | 'minuteOfDay' | 'timeZone'> &
    Pick<Routine, 'createdBy' | 'lastRunAt'>,
): Routine {
  const id = newId()
  ws.db
    .insert(routineTable)
    .values({ ...input, id, enabled: true, sessionId: null, createdAt: ws.now() })
    .run()
  return getRoutine(ws, id) as Routine
}

export function updateRoutine(
  ws: Workspace,
  id: string,
  patch: Partial<
    Pick<
      Routine,
      | 'title'
      | 'prompt'
      | 'cron'
      | 'minuteOfDay'
      | 'timeZone'
      | 'enabled'
      | 'lastRunAt'
      | 'sessionId'
    >
  >,
): Routine | null {
  ws.db.update(routineTable).set(patch).where(eq(routineTable.id, id)).run()
  return getRoutine(ws, id)
}

/** Its runs' rows go; their chats stay — they are conversations now, not the routine's. */
export function deleteRoutine(ws: Workspace, id: string): void {
  ws.db.delete(routineRunTable).where(eq(routineRunTable.routineId, id)).run()
  ws.db.delete(routineTable).where(eq(routineTable.id, id)).run()
}

export function recordRoutineRun(
  ws: Workspace,
  run: Pick<RoutineRun, 'routineId' | 'sessionId' | 'trigger'>,
): void {
  ws.db
    .insert(routineRunTable)
    .values({ ...run, id: newId(), startedAt: ws.now() })
    .run()
}

interface RunRow {
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

const wallMs = (hlc: string) => Number(hlc.slice(0, 14))

/** Newest first. Running, waiting on a person, failed or done — as its chat says. */
export function listRoutineRuns(ws: Workspace, routineId: string, limit: number): RoutineRun[] {
  const rows = ws.sqlite
    .query(
      `SELECT r.id, r.routine_id AS routineId, r.session_id AS sessionId, r.trigger,
         r.started_at AS startedAt, s.status AS sessionStatus, s.cost_usd AS costUsd,
         s.updated_at AS endedAt,
         EXISTS (SELECT 1 FROM approvals a
           WHERE a.session_id = r.session_id AND a.status = 'pending') AS waiting
       FROM routine_runs r LEFT JOIN agent_sessions s ON s.id = r.session_id
       WHERE r.routine_id = ? ORDER BY r.started_at DESC LIMIT ?`,
    )
    .all(routineId, limit) as RunRow[]
  return rows.map((row) => {
    const status: RoutineRun['status'] = row.waiting
      ? 'waiting'
      : row.sessionStatus === 'running'
        ? 'running'
        : row.sessionStatus === 'error'
          ? 'failed'
          : 'done'
    return {
      id: row.id,
      routineId: row.routineId,
      sessionId: row.sessionId,
      trigger: row.trigger,
      startedAt: row.startedAt,
      status,
      costUsd: row.costUsd ?? 0,
      durationMs:
        status === 'running' || !row.endedAt
          ? null
          : Math.max(0, wallMs(row.endedAt) - wallMs(row.startedAt)),
    }
  })
}
