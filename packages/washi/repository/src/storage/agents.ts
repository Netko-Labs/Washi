import type {
  AgentSession,
  AgentUpdate,
  ApprovalRequest,
  ChatAnchor,
  ChatMove,
  TranscriptEntry,
} from '@washi/domain'
import { agentSessionTable, agentTurnTable, approvalTable } from '@washi/domain/db'
import { asc, desc, eq, isNotNull, isNull, or } from 'drizzle-orm'
import { forgetChatSearch, indexChatSearch } from './chat-search'
import { newId, type Workspace } from './client'

function toSession(row: typeof agentSessionTable.$inferSelect): AgentSession {
  return {
    id: row.id,
    provider: row.provider,
    title: row.title,
    status: row.status as AgentSession['status'],
    costUsd: row.costUsd,
    model: row.model,
    effort: row.effort as AgentSession['effort'],
    approvals: row.approvals as AgentSession['approvals'],
    createdBy: row.createdBy,
    anchor:
      row.anchorSheetId && row.anchorScope
        ? { sheetId: row.anchorSheetId, scope: row.anchorScope as ChatAnchor['scope'] }
        : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/** Every chat, or only those `viewerId` may read: theirs and the workspace's (D67). */
export function listSessions(ws: Workspace, viewerId?: string | null): AgentSession[] {
  const query = ws.db.select().from(agentSessionTable)
  const workspaces = isNull(agentSessionTable.createdBy)
  const scoped =
    viewerId === undefined
      ? query
      : query.where(
          viewerId === null
            ? workspaces
            : or(workspaces, eq(agentSessionTable.createdBy, viewerId)),
        )
  return scoped.orderBy(desc(agentSessionTable.updatedAt)).all().map(toSession)
}

/** A chat nobody can find is no secret, so a missing one reads as visible. */
export function isSessionVisible(ws: Workspace, id: string, viewerId: string | null): boolean {
  const [row] = ws.db
    .select({ createdBy: agentSessionTable.createdBy })
    .from(agentSessionTable)
    .where(eq(agentSessionTable.id, id))
    .all()
  return !row || row.createdBy === null || row.createdBy === viewerId
}

export function createSession(
  ws: Workspace,
  title: string,
  options: { createdBy?: string | null; anchor?: ChatAnchor | null } = {},
): AgentSession {
  const now = ws.now()
  const id = newId()
  ws.db
    .insert(agentSessionTable)
    .values({
      id,
      title,
      createdBy: options.createdBy ?? null,
      anchorSheetId: options.anchor?.sheetId ?? null,
      anchorScope: options.anchor?.scope ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .run()
  return toSession(
    ws.db.select().from(agentSessionTable).where(eq(agentSessionTable.id, id)).all()[0]!,
  )
}

export function updateSession(
  ws: Workspace,
  id: string,
  patch: Partial<{
    status: string
    costUsd: number
    sdkSessionId: string
    title: string
    model: string | null
    effort: string | null
    approvals: string | null
  }>,
): void {
  ws.db
    .update(agentSessionTable)
    .set({ ...patch, updatedAt: ws.now() })
    .where(eq(agentSessionTable.id, id))
    .run()
  if (patch.title !== undefined) indexChatSearch(ws, id)
}

/** Every conversation back on the workspace's approvals, as when it stops allowing its own (D115). */
export function clearSessionApprovals(ws: Workspace): void {
  ws.db
    .update(agentSessionTable)
    .set({ approvals: null })
    .where(isNotNull(agentSessionTable.approvals))
    .run()
}

/** Where a chat lives (D110); null is Home. The move counts as activity, so it sorts first. */
export function setSessionAnchor(ws: Workspace, id: string, anchor: ChatAnchor | null): void {
  ws.db
    .update(agentSessionTable)
    .set({
      anchorSheetId: anchor?.sheetId ?? null,
      anchorScope: anchor?.scope ?? null,
      updatedAt: ws.now(),
    })
    .where(eq(agentSessionTable.id, id))
    .run()
}

/** The newest of `viewerId`'s chats that left `sheetId` and has not come back (D110). */
export function latestMoveFrom(ws: Workspace, sheetId: string, viewerId: string): ChatMove | null {
  const row = ws.sqlite
    .query(
      `SELECT s.id AS sessionId, s.anchor_sheet_id AS sheetId, s.title AS title, t.created_at AS at
       FROM agent_turns t JOIN agent_sessions s ON s.id = t.session_id
       WHERE json_extract(t.payload, '$.kind') = 'handoff'
         AND json_extract(t.payload, '$.from') = ?
         AND s.created_by = ?
         AND s.anchor_sheet_id IS NOT ?
       ORDER BY t.created_at DESC LIMIT 1`,
    )
    .get(sheetId, viewerId, sheetId) as ChatMove | null
  return row ?? null
}

/** The conversation, its turns and its answered questions. A running one is refused upstream. */
export function deleteSession(ws: Workspace, id: string): void {
  forgetChatSearch(ws, id)
  ws.db.delete(agentTurnTable).where(eq(agentTurnTable.sessionId, id)).run()
  ws.db.delete(approvalTable).where(eq(approvalTable.sessionId, id)).run()
  ws.db.delete(agentSessionTable).where(eq(agentSessionTable.id, id)).run()
}

export function getSession(ws: Workspace, id: string): AgentSession | null {
  const [row] = ws.db.select().from(agentSessionTable).where(eq(agentSessionTable.id, id)).all()
  return row ? toSession(row) : null
}

export function getSdkSessionId(ws: Workspace, id: string): string | null {
  const [row] = ws.db.select().from(agentSessionTable).where(eq(agentSessionTable.id, id)).all()
  return row?.sdkSessionId ?? null
}

export function appendTurn(ws: Workspace, sessionId: string, update: AgentUpdate): TranscriptEntry {
  const [last] = ws.db
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
    createdAt: ws.now(),
  }
  ws.db
    .insert(agentTurnTable)
    .values({
      id: entry.id,
      sessionId,
      seq: entry.seq,
      payload: update,
      createdAt: entry.createdAt,
    })
    .run()
  if (update.kind === 'user_message' || update.kind === 'turn_done') indexChatSearch(ws, sessionId)
  return entry
}

export function getTranscript(ws: Workspace, sessionId: string): TranscriptEntry[] {
  return ws.db
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
  ws: Workspace,
  sessionId: string,
  toolName: string,
  input: unknown,
): ApprovalRequest {
  const request: ApprovalRequest = {
    id: newId(),
    sessionId,
    toolName,
    input,
    createdAt: ws.now(),
  }
  ws.db
    .insert(approvalTable)
    .values({ ...request, input: request.input ?? null })
    .run()
  return request
}

export function resolveApproval(
  ws: Workspace,
  id: string,
  status: 'allowed' | 'denied',
  actorId: string | null = null,
): boolean {
  const result = ws.sqlite
    .query(
      "UPDATE approvals SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ? AND status = 'pending'",
    )
    .run(status, ws.now(), actorId, id)
  return result.changes > 0
}

/**
 * Nobody is waiting on a pending row from a previous process — its turn died with
 * that process. Expire them at boot so a stale question never looks answerable.
 */
export function expirePendingApprovals(ws: Workspace): number {
  const result = ws.sqlite
    .query("UPDATE approvals SET status = 'denied', resolved_at = ? WHERE status = 'pending'")
    .run(ws.now())
  return result.changes
}

/**
 * A turn cannot outlive its process: anything still `running` at boot was cut off mid-way.
 * Answers their ids, so each gets its receipt.
 */
export function failInterruptedSessions(ws: Workspace): string[] {
  const rows = ws.sqlite
    .query("UPDATE agent_sessions SET status = 'error' WHERE status = 'running' RETURNING id")
    .all() as { id: string }[]
  return rows.map((row) => row.id)
}
