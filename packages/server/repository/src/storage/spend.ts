import type { TurnBilling } from '@washi/domain'
import { agentSpendTable } from '@washi/domain/db'
import { eq, sql } from 'drizzle-orm'
import type { Workspace } from './client'
import { getAppMeta, setAppMeta } from './meta'

const PAUSED_KEY = 'agent_paused_until'
const ACKNOWLEDGED_KEY = 'agent_spend_acknowledged'

export interface DaySpend {
  day: string
  costUsd: number
  savedUsd: number
  turns: number
}

export interface SpendOptions {
  day?: string
  billing?: TurnBilling
}

/** UTC, so a cap is the same length of day wherever the server is. */
export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function spendForDay(ws: Workspace, day = today()): DaySpend {
  const [row] = ws.db.select().from(agentSpendTable).where(eq(agentSpendTable.day, day)).all()
  return {
    day,
    costUsd: row?.costUsd ?? 0,
    savedUsd: row?.savedUsd ?? 0,
    turns: row?.turns ?? 0,
  }
}

/**
 * Accumulate what a turn cost. The SDK reports a total per turn, so this is a
 * sum of turns rather than a running meter — close enough to stop a loop, which
 * is the only thing it is for.
 *
 * A `plan` turn ran on a local Claude login: its cost is notional, so it lands
 * in `savedUsd` and never moves the dollar cap. It still counts as a turn.
 *
 * A null cost still counts the turn. Some models publish no price at all
 * (`openrouter/auto` routes to anything), and a turn nobody can price must not
 * also be a turn nobody counts — that is the one the breaker would never see.
 */
export function recordSpend(
  ws: Workspace,
  costUsd: number | null,
  { day = today(), billing = 'metered' }: SpendOptions = {},
): DaySpend {
  const amount = Math.max(0, costUsd ?? 0)
  const row = ws.db
    .insert(agentSpendTable)
    .values({
      day,
      costUsd: billing === 'metered' ? amount : 0,
      savedUsd: billing === 'plan' ? amount : 0,
      turns: 1,
      updatedAt: ws.now(),
    })
    .onConflictDoUpdate({
      target: agentSpendTable.day,
      set: {
        costUsd: sql`${agentSpendTable.costUsd} + excluded.cost_usd`,
        savedUsd: sql`${agentSpendTable.savedUsd} + excluded.saved_usd`,
        turns: sql`${agentSpendTable.turns} + excluded.turns`,
        updatedAt: sql`excluded.updated_at`,
      },
    })
    .returning()
    .get()
  return { day, costUsd: row.costUsd, savedUsd: row.savedUsd, turns: row.turns }
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
  return acknowledged(ws, day).costUsd
}

/** Turns are acknowledged the same way, or a turn-cap trip could never be resumed. */
export function acknowledgedTurns(ws: Workspace, day = today()): number {
  return acknowledged(ws, day).turns
}

function acknowledged(ws: Workspace, day: string): { costUsd: number; turns: number } {
  const raw = getAppMeta(ws, ACKNOWLEDGED_KEY)
  if (!raw) return { costUsd: 0, turns: 0 }
  const [storedDay, amount, turns] = raw.split('|')
  if (storedDay !== day) return { costUsd: 0, turns: 0 }
  const costUsd = Number(amount)
  const turnCount = Number(turns)
  return {
    costUsd: Number.isFinite(costUsd) ? costUsd : 0,
    turns: Number.isFinite(turnCount) ? turnCount : 0,
  }
}

export function resumeAgent(ws: Workspace, day = today()): void {
  const spend = spendForDay(ws, day)
  setAppMeta(ws, PAUSED_KEY, '')
  setAppMeta(ws, ACKNOWLEDGED_KEY, `${day}|${spend.costUsd}|${spend.turns}`)
}
