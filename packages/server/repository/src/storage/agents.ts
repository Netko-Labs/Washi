import type {
  AgentSession,
  AgentUpdate,
  ApprovalRequest,
  TranscriptEntry,
} from '@washi/domain'
import { agentSessionTable, agentTurnTable, approvalTable } from '@washi/domain/db'
import { asc, desc, eq } from 'drizzle-orm'
import { getDb, getSqlite, hlcNow, newId } from './client'

function toSession(row: typeof agentSessionTable.$inferSelect): AgentSession {
  return {
    id: row.id,
    provider: row.provider,
    title: row.title,
    status: row.status as AgentSession['status'],
    costUsd: row.costUsd,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function listSessions(): AgentSession[] {
  return getDb()
    .select()
    .from(agentSessionTable)
    .orderBy(desc(agentSessionTable.updatedAt))
    .all()
    .map(toSession)
}

export function createSession(title: string): AgentSession {
  const now = hlcNow()
  const id = newId()
  getDb().insert(agentSessionTable).values({ id, title, createdAt: now, updatedAt: now }).run()
  return toSession(
    getDb().select().from(agentSessionTable).where(eq(agentSessionTable.id, id)).all()[0]!,
  )
}

export function updateSession(
  id: string,
  patch: Partial<{ status: string; costUsd: number; sdkSessionId: string; title: string }>,
): void {
  getDb()
    .update(agentSessionTable)
    .set({ ...patch, updatedAt: hlcNow() })
    .where(eq(agentSessionTable.id, id))
    .run()
}

export function getSdkSessionId(id: string): string | null {
  const [row] = getDb().select().from(agentSessionTable).where(eq(agentSessionTable.id, id)).all()
  return row?.sdkSessionId ?? null
}

export function appendTurn(sessionId: string, update: AgentUpdate): TranscriptEntry {
  const db = getDb()
  const [last] = db
    .select({ seq: agentTurnTable.seq })
    .from(agentTurnTable)
    .where(eq(agentTurnTable.sessionId, sessionId))
    .orderBy(desc(agentTurnTable.seq))
    .limit(1)
    .all()
  const entry: TranscriptEntry = {
    id: newId(),
    seq: (last?.seq ?? 0) + 1,
    update,
    createdAt: hlcNow(),
  }
  db.insert(agentTurnTable)
    .values({
      id: entry.id,
      sessionId,
      seq: entry.seq,
      payload: update,
      createdAt: entry.createdAt,
    })
    .run()
  return entry
}

export function getTranscript(sessionId: string): TranscriptEntry[] {
  return getDb()
    .select()
    .from(agentTurnTable)
    .where(eq(agentTurnTable.sessionId, sessionId))
    .orderBy(asc(agentTurnTable.seq))
    .all()
    .map((row) => ({
      id: row.id,
      seq: row.seq,
      update: row.payload as AgentUpdate,
      createdAt: row.createdAt,
    }))
}

export function createApproval(
  sessionId: string,
  toolName: string,
  input: unknown,
): ApprovalRequest {
  const request: ApprovalRequest = {
    id: newId(),
    sessionId,
    toolName,
    input,
    createdAt: hlcNow(),
  }
  getDb()
    .insert(approvalTable)
    .values({ ...request, input: request.input ?? null })
    .run()
  return request
}

export function resolveApproval(id: string, status: 'allowed' | 'denied'): boolean {
  const result = getSqlite()
    .query("UPDATE approvals SET status = ?, resolved_at = ? WHERE id = ? AND status = 'pending'")
    .run(status, hlcNow(), id)
  return result.changes > 0
}
