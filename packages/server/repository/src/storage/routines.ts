import type { Routine, RoutineCreate } from '@washi/domain'
import { routineTable } from '@washi/domain/db'
import { asc, eq } from 'drizzle-orm'
import { newId, type Workspace } from './client'

export function listRoutines(ws: Workspace): Routine[] {
  return ws.db.select().from(routineTable).orderBy(asc(routineTable.minuteUtc)).all()
}

export function getRoutine(ws: Workspace, id: string): Routine | null {
  return ws.db.select().from(routineTable).where(eq(routineTable.id, id)).get() ?? null
}

export function createRoutine(
  ws: Workspace,
  input: RoutineCreate & { createdBy: string | null; lastRunDay: string | null },
): Routine {
  const routine: Routine = {
    id: newId(),
    title: input.title,
    prompt: input.prompt,
    minuteUtc: input.minuteUtc,
    enabled: true,
    lastRunDay: input.lastRunDay,
    sessionId: null,
    createdBy: input.createdBy,
    createdAt: ws.now(),
  }
  ws.db.insert(routineTable).values(routine).run()
  return routine
}

export function updateRoutine(
  ws: Workspace,
  id: string,
  patch: Partial<Pick<Routine, 'enabled' | 'lastRunDay' | 'sessionId'>>,
): Routine | null {
  ws.db.update(routineTable).set(patch).where(eq(routineTable.id, id)).run()
  return getRoutine(ws, id)
}

export function deleteRoutine(ws: Workspace, id: string): void {
  ws.db.delete(routineTable).where(eq(routineTable.id, id)).run()
}
