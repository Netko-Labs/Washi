import type { CapabilityCall, CapabilityWrite } from '@washi/domain'
import { capabilityCallTable } from '@washi/domain/db'
import { desc } from 'drizzle-orm'
import { getDb, hlcNow, newId } from './client'

/** Append-only: every capability call, both origins, allowed or not (spec §09). */
export function recordCapability(write: CapabilityWrite): CapabilityCall {
  const call: CapabilityCall = {
    id: newId(),
    origin: write.origin,
    subject: write.subject,
    input: write.input ?? null,
    decision: write.decision,
    detail: write.detail ?? null,
    createdAt: hlcNow(),
  }
  getDb().insert(capabilityCallTable).values(call).run()
  return call
}

export function listCapabilityCalls(limit = 100): CapabilityCall[] {
  return getDb()
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
