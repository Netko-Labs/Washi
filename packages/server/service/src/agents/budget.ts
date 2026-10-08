import type { TurnBilling } from '@washi/domain'
import {
  acknowledgedSpend,
  getAppMeta,
  pauseAgent,
  pausedOn,
  recordSpend,
  resumeAgent,
  setAppMeta,
  spendForDay,
  today,
  type Workspace,
} from '@washi/repository'
import type { AgentSpendReport, BreakerState } from './lib'
import {
  DAILY_CAP_USD_KEY,
  DAILY_TURN_CAP_KEY,
  DEFAULT_DAILY_CAP_USD,
  DEFAULT_DAILY_TURN_CAP,
} from './lib'

/**
 * The daily stop (Q25): a safety stop, not a quota. It answers one question —
 * may another turn start — and only a person answers it back.
 */
export class DailyBudget {
  private readonly ws: Workspace

  constructor(ws: Workspace) {
    this.ws = ws
  }

  /** Per workspace and settable, because a sane default is not a universal one. */
  capUsd(): number {
    return this.setting(DAILY_CAP_USD_KEY, DEFAULT_DAILY_CAP_USD)
  }

  /** The bound that still holds when a model publishes no price at all. */
  turnCap(): number {
    return this.setting(DAILY_TURN_CAP_KEY, DEFAULT_DAILY_TURN_CAP)
  }

  breaker(): BreakerState {
    const day = today()
    const paused = pausedOn(this.ws)
    if (paused) return { kind: 'paused', day: paused }
    const { costUsd, turns } = spendForDay(this.ws, day)
    const capUsd = this.capUsd()
    // Measured from the last acknowledgement, so Resume grants real headroom.
    if (costUsd - acknowledgedSpend(this.ws, day) >= capUsd) {
      return { kind: 'tripped', day, costUsd, capUsd }
    }
    // An unpriced model (openrouter/auto routes to anything) contributes $0 to
    // the line above forever, so turns are the bound that still applies.
    if (turns >= this.turnCap()) return { kind: 'tripped', day, costUsd, capUsd }
    return { kind: 'open' }
  }

  report(): AgentSpendReport {
    const { day, costUsd, savedUsd, turns } = spendForDay(this.ws)
    return {
      day,
      costUsd,
      savedUsd,
      turns,
      capUsd: this.capUsd(),
      turnCap: this.turnCap(),
      paused: Boolean(pausedOn(this.ws)),
    }
  }

  setCap(capUsd: number): AgentSpendReport {
    if (!Number.isFinite(capUsd) || capUsd <= 0) throw new Error('a daily stop must be above $0')
    setAppMeta(this.ws, DAILY_CAP_USD_KEY, String(capUsd))
    return this.report()
  }

  resume(): void {
    resumeAgent(this.ws)
  }

  /** Every turn counts, priced or not, plan or key. Only metered dollars move the cap. */
  charge(costUsd: number | null, billing: TurnBilling): void {
    const total = recordSpend(this.ws, costUsd, { billing })
    const overSpend = total.costUsd >= this.capUsd() + acknowledgedSpend(this.ws)
    if (overSpend || total.turns >= this.turnCap()) pauseAgent(this.ws)
  }

  private setting(key: string, fallback: number): number {
    const stored = getAppMeta(this.ws, key)
    const parsed = stored ? Number(stored) : Number.NaN
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }
}
