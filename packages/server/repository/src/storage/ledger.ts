import type { CapabilityCall, CapabilityWrite } from '@washi/domain'
import { capabilityCallTable } from '@washi/domain/db'
import { desc } from 'drizzle-orm'
import { newId, type Workspace } from './client'

/** Append-only: every capability call, both origins, allowed or not (spec §09). */
export function recordCapability(ws: Workspace, write: CapabilityWrite): CapabilityCall {
  const call: CapabilityCall = {
    id: newId(),
    origin: write.origin,
    actorId: write.actorId ?? null,
    subject: write.subject,
    input: write.input ?? null,
    decision: write.decision,
    detail: write.detail ?? null,
    createdAt: ws.now(),
  }
  ws.db.insert(capabilityCallTable).values(call).run()
  return call
}

export function listCapabilityCalls(ws: Workspace, limit = 100): CapabilityCall[] {
  return ws.db
    .select()
    .from(capabilityCallTable)
    .orderBy(desc(capabilityCallTable.createdAt))
    .limit(limit)
    .all()
    .map((row) => ({
      ...row,
      origin: row.origin as CapabilityCall['origin'],
      decision: row.decision as CapabilityCall['decision'],
    }))
}
