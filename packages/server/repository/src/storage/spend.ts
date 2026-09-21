import { agentSpendTable } from '@washi/domain/db'
import { eq } from 'drizzle-orm'
import type { Workspace } from './client'
import { getAppMeta, setAppMeta } from './meta'

const PAUSED_KEY = 'agent_paused_until'
const ACKNOWLEDGED_KEY = 'agent_spend_acknowledged'

export interface DaySpend {
  day: string
  costUsd: number
  turns: number
}

/** UTC, so a cap is the same length of day wherever the server is. */
export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function spendForDay(ws: Workspace, day = today()): DaySpend {
  const [row] = ws.db.select().from(agentSpendTable).where(eq(agentSpendTable.day, day)).all()
  return { day, costUsd: row?.costUsd ?? 0, turns: row?.turns ?? 0 }
}

/**
 * Accumulate what a turn cost. The SDK reports a total per turn, so this is a
 * sum of turns rather than a running meter — close enough to stop a loop, which
 * is the only thing it is for.
 */
export function recordSpend(ws: Workspace, costUsd: number, day = today()): DaySpend {
  const current = spendForDay(ws, day)
  const next = {
    day,
    costUsd: current.costUsd + Math.max(0, costUsd),
    turns: current.turns + 1,
    updatedAt: ws.now(),
  }
  ws.db
    .insert(agentSpendTable)
    .values(next)
    .onConflictDoUpdate({
      target: agentSpendTable.day,
      set: { costUsd: next.costUsd, turns: next.turns, updatedAt: next.updatedAt },
    })
    .run()
  return { day, costUsd: next.costUsd, turns: next.turns }
}

/** The day the breaker tripped, or null. A person clears it; nothing clears it for them. */
export function pausedOn(ws: Workspace): string | null {
  return getAppMeta(ws, PAUSED_KEY) || null
}

export function pauseAgent(ws: Workspace, day = today()): void {
  setAppMeta(ws, PAUSED_KEY, day)
}

/**
 * What today's spend was when a person last said "carry on". The cap is measured
 * from here, not from zero — otherwise Resume clears the flag and the very next
 * check trips again on the same spend, which is a button that does nothing.
 */
export function acknowledgedSpend(ws: Workspace, day = today()): number {
  const raw = getAppMeta(ws, ACKNOWLEDGED_KEY)
  if (!raw) return 0
  const [storedDay, amount] = raw.split('|')
  if (storedDay !== day) return 0
  const parsed = Number(amount)
  return Number.isFinite(parsed) ? parsed : 0
}

export function resumeAgent(ws: Workspace, day = today()): void {
  setAppMeta(ws, PAUSED_KEY, '')
  setAppMeta(ws, ACKNOWLEDGED_KEY, `${day}|${spendForDay(ws, day).costUsd}`)
}
