import type { AgentUpdate, ApprovalDecision } from '@washi/domain'
import { createModelCatalogue, type ModelCatalogue } from '@washi/models'
import {
  acknowledgedSpend,
  appendTurn,
  getAppMeta,
  getSdkSessionId,
  getSheet,
  getTranscript,
  pauseAgent,
  pausedOn,
  recordSpend,
  resumeAgent,
  setAppMeta,
  spendForDay,
  today,
  updateSession,
  type Workspace,
} from '@washi/repository'
import { ApprovalDesk } from './approvals'
import { CapabilityDesk } from './desk'
import { createEmbeddedKeySource } from './inference'
import type {
  AgentActivity,
  AgentCredential,
  AgentHostEvents,
  AgentKeySource,
  AgentSpendReport,
  BreakerState,
  Caller,
  InferencePreference,
  InferenceStatus,
} from './lib'
import {
  DAILY_CAP_USD_KEY,
  DAILY_TURN_CAP_KEY,
  DEFAULT_DAILY_CAP_USD,
  DEFAULT_DAILY_TURN_CAP,
  SYSTEM_INSTRUCTIONS,
} from './lib'
import { proposedDiff } from './normalize'
import { type AgentPort, createAiSdkPort, createClaudeSdkPort, type TurnResult } from './ports'

export class AgentHost {
  private events: AgentHostEvents | null = null
  private running = 0

  private readonly ws: Workspace
  private readonly keys: AgentKeySource
  private readonly desk: CapabilityDesk
  private readonly approvals: ApprovalDesk
  private readonly claudePort: AgentPort
  private readonly aiSdkPort: AgentPort

  /** No key source means embedded: the local Claude login, then the machine's env key. */
  constructor(ws: Workspace, keys?: AgentKeySource, catalogue?: ModelCatalogue) {
    this.ws = ws
    this.keys = keys ?? createEmbeddedKeySource(ws)
    const events = () => this.events
    this.desk = new CapabilityDesk(ws, events)
    this.approvals = new ApprovalDesk(ws, events, this.desk)

    const runHankoAction = (action: unknown) => this.desk.execute(action)
    this.claudePort = createClaudeSdkPort({
      ws,
      instructions: SYSTEM_INSTRUCTIONS,
      runHankoAction,
      canUseTool: (sessionId, name, input) => this.approvals.gateSdkTool(sessionId, name, input),
    })
    this.aiSdkPort = createAiSdkPort({
      ws,
      instructions: SYSTEM_INSTRUCTIONS,
      runHankoAction,
      gate: this.approvals,
      catalogue: catalogue ?? createModelCatalogue(),
    })
  }

  /** The cap is per workspace and settable, because a sane default is not a universal one. */
  private dailyCap(): number {
    return this.setting(DAILY_CAP_USD_KEY, DEFAULT_DAILY_CAP_USD)
  }

  /** The bound that still holds when a model publishes no price at all. */
  private dailyTurnCap(): number {
    return this.setting(DAILY_TURN_CAP_KEY, DEFAULT_DAILY_TURN_CAP)
  }

  private setting(key: string, fallback: number): number {
    const stored = getAppMeta(this.ws, key)
    const parsed = stored ? Number(stored) : Number.NaN
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }

  /**
   * A safety stop, not a quota (Q25). It answers one question — may another
   * turn start — and only a person answers it back.
   */
  breaker(): BreakerState {
    const day = today()
    const paused = pausedOn(this.ws)
    if (paused) return { kind: 'paused', day: paused }
    const { costUsd, turns } = spendForDay(this.ws, day)
    const capUsd = this.dailyCap()
    // Measured from the last acknowledgement, so Resume grants real headroom.
    if (costUsd - acknowledgedSpend(this.ws, day) >= capUsd) {
      return { kind: 'tripped', day, costUsd, capUsd }
    }
    // An unpriced model (openrouter/auto routes to anything) contributes $0 to
    // the line above forever, so turns are the bound that still applies.
    if (turns >= this.dailyTurnCap()) return { kind: 'tripped', day, costUsd, capUsd }
    return { kind: 'open' }
  }

  spend(): AgentSpendReport {
    const { day, costUsd, savedUsd, turns } = spendForDay(this.ws)
    return {
      day,
      costUsd,
      savedUsd,
      turns,
      capUsd: this.dailyCap(),
      turnCap: this.dailyTurnCap(),
      paused: Boolean(pausedOn(this.ws)),
    }
  }

  /** What the shell shows without opening settings: is Washi idle, busy, or waiting on someone. */
  activity(): AgentActivity {
    const breaker = this.breaker()
    const state = this.approvals.hasPending()
      ? 'needs_you'
      : this.running > 0
        ? 'working'
        : breaker.kind === 'open'
          ? 'idle'
          : 'paused'
    return { state, ...this.spend() }
  }

  setDailyCap(capUsd: number): AgentSpendReport {
    if (!Number.isFinite(capUsd) || capUsd <= 0) throw new Error('a daily stop must be above $0')
    setAppMeta(this.ws, DAILY_CAP_USD_KEY, String(capUsd))
    return this.spend()
  }

  resume(): void {
    resumeAgent(this.ws)
  }

  inference(): Promise<InferenceStatus> {
    return this.keys.status()
  }

  async setInference(preference: InferencePreference): Promise<InferenceStatus> {
    if (!this.keys.setPreference) {
      throw new Error('this server runs every workspace on its own key — there is nothing to pick')
    }
    return this.keys.setPreference(preference)
  }

  setEvents(events: AgentHostEvents): void {
    this.events = events
  }

  resolveApprovalRequest(id: string, decision: ApprovalDecision): void {
    this.approvals.resolve(id, decision)
  }

  executeAction(input: unknown, caller: Caller = { origin: 'agent' }): Promise<void> {
    return this.desk.execute(input, caller)
  }

  fetchForSheet(url: string, actorId: string | null = null): Promise<string> {
    return this.desk.fetchForSheet(url, actorId)
  }

  /** One user turn: persist, run it on whichever port the credential picks, close it with a receipt. */
  async prompt(sessionId: string, text: string): Promise<void> {
    this.record(sessionId, { kind: 'user_message', text })

    const state = this.breaker()
    if (state.kind !== 'open') {
      this.fail(
        sessionId,
        state.kind === 'paused'
          ? 'The agent is paused for this workspace. Resume it in settings.'
          : `This workspace has spent ${state.costUsd.toFixed(2)} of its ${state.capUsd} daily cap. Raise the cap or resume tomorrow.`,
      )
      return
    }

    const credential = await this.keys.resolve()
    if (!credential) {
      const status = await this.keys.status()
      this.fail(sessionId, status.missing ?? 'Nothing can run this turn yet.')
      return
    }

    // Two ports, one vocabulary (§05). Anthropic keeps the native Claude Agent
    // SDK path, which resumes sessions itself; anything else goes through the
    // AI SDK, where Washi owns the history.
    const native = credential.provider === 'anthropic'
    const port = native ? this.claudePort : this.aiSdkPort
    const started = Date.now()
    updateSession(this.ws, sessionId, { status: 'running' })
    this.running += 1

    try {
      const result = await port.prompt(
        {
          sessionId,
          text,
          credential,
          model: { provider: credential.provider, model: credential.model },
          history: native ? [] : this.history(sessionId),
          resumeToken: native ? getSdkSessionId(this.ws, sessionId) : null,
        },
        (update) => this.emit(sessionId, update),
      )
      this.close(sessionId, credential, result, Date.now() - started)
    } catch (error) {
      this.record(sessionId, {
        kind: 'turn_done',
        stopReason: 'error',
        error: String(error),
        durationMs: Date.now() - started,
      })
      updateSession(this.ws, sessionId, { status: 'error' })
    } finally {
      this.running -= 1
    }
  }

  private close(
    sessionId: string,
    credential: AgentCredential,
    result: TurnResult,
    durationMs: number,
  ) {
    this.record(sessionId, {
      kind: 'turn_done',
      stopReason: result.error ? 'error' : 'end_turn',
      ...(result.error ? { error: result.error } : {}),
      ...(result.costUsd != null ? { costUsd: result.costUsd } : {}),
      billing: result.billing,
      model: result.model ?? credential.model,
      durationMs,
    })
    updateSession(this.ws, sessionId, {
      status: result.error ? 'error' : 'idle',
      ...(result.resumeToken ? { sdkSessionId: result.resumeToken } : {}),
      ...(result.costUsd != null && result.billing === 'metered'
        ? { costUsd: result.costUsd }
        : {}),
    })

    // Every turn counts, priced or not, plan or key. Only metered dollars move the cap.
    const total = recordSpend(this.ws, result.costUsd, { billing: result.billing })
    const overSpend = total.costUsd >= this.dailyCap() + acknowledgedSpend(this.ws)
    if (overSpend || total.turns >= this.dailyTurnCap()) pauseAgent(this.ws)
  }

  private fail(sessionId: string, error: string) {
    this.record(sessionId, { kind: 'turn_done', stopReason: 'error', error })
    updateSession(this.ws, sessionId, { status: 'error' })
  }

  /** The AI SDK port has no server-side session, so it is handed the conversation so far. */
  private history(sessionId: string) {
    return getTranscript(this.ws, sessionId)
      .flatMap((entry) =>
        entry.update.kind === 'user_message'
          ? [{ role: 'user' as const, text: entry.update.text }]
          : [],
      )
      .slice(0, -1)
  }

  /** sheet_replace proposals also render as diffs in the transcript (spec §6). */
  private emit(sessionId: string, update: AgentUpdate) {
    this.record(sessionId, update)
    const diff = proposedDiff(update, (id) => getSheet(this.ws, id))
    if (diff) this.record(sessionId, diff)
  }

  private record(sessionId: string, update: AgentUpdate) {
    const entry = appendTurn(this.ws, sessionId, update)
    this.events?.update(sessionId, entry)
  }
}
