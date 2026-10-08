import type { AgentUpdate, ApprovalDecision, ApprovalRequest } from '@washi/domain'
import { createModelCatalogue, type ModelCatalogue } from '@washi/models'
import {
  appendTurn,
  expirePendingApprovals,
  getSdkSessionId,
  getSheet,
  getTranscript,
  updateSession,
  type Workspace,
} from '@washi/repository'
import { ApprovalDesk } from './approvals'
import { DailyBudget } from './budget'
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
  LocalModel,
  TodayReport,
} from './lib'
import { SYSTEM_INSTRUCTIONS } from './lib'
import { proposedDiff } from './normalize'
import { type AgentPort, createAiSdkPort, createClaudeSdkPort, type TurnResult } from './ports'
import { recentTurns } from './today'

export class AgentHost {
  private events: AgentHostEvents | null = null
  /** One per running turn, keyed by session — Stop aborts exactly that turn. */
  private readonly turns = new Map<string, AbortController>()

  private readonly ws: Workspace
  private readonly keys: AgentKeySource
  private readonly desk: CapabilityDesk
  private readonly approvals: ApprovalDesk
  private readonly budget: DailyBudget
  private readonly claudePort: AgentPort
  private readonly aiSdkPort: AgentPort

  /** No key source means embedded: the local Claude login, then the machine's env key. */
  constructor(ws: Workspace, keys?: AgentKeySource, catalogue?: ModelCatalogue) {
    this.ws = ws
    this.keys = keys ?? createEmbeddedKeySource(ws)
    const events = () => this.events
    this.desk = new CapabilityDesk(ws, events)
    this.approvals = new ApprovalDesk(ws, events, this.desk)
    this.budget = new DailyBudget(ws)
    expirePendingApprovals(ws)

    const runHankoAction = (action: unknown) => this.desk.execute(action)
    const openSheet = (id: string) => this.events?.openSheet(id)
    const models = catalogue ?? createModelCatalogue()
    this.claudePort = createClaudeSdkPort({
      ws,
      catalogue: models,
      instructions: SYSTEM_INSTRUCTIONS,
      runHankoAction,
      openSheet,
      canUseTool: (sessionId, name, input) => this.approvals.gateSdkTool(sessionId, name, input),
    })
    this.aiSdkPort = createAiSdkPort({
      ws,
      instructions: SYSTEM_INSTRUCTIONS,
      runHankoAction,
      openSheet,
      gate: this.approvals,
      catalogue: models,
    })
  }

  breaker(): BreakerState {
    return this.budget.breaker()
  }

  spend(): AgentSpendReport {
    return this.budget.report()
  }

  /** What the shell shows without opening settings: is Washi idle, busy, or waiting on someone. */
  activity(): AgentActivity {
    const breaker = this.breaker()
    const state = this.approvals.hasPending()
      ? 'needs_you'
      : this.turns.size > 0
        ? 'working'
        : breaker.kind === 'open'
          ? 'idle'
          : 'paused'
    return { state, ...this.spend() }
  }

  setDailyCap(capUsd: number): AgentSpendReport {
    return this.budget.setCap(capUsd)
  }

  resume(): void {
    this.budget.resume()
  }

  /** Stop the session's running turn. Its open approvals are answered "no" on the way out. */
  cancel(sessionId: string): boolean {
    const turn = this.turns.get(sessionId)
    if (!turn) return false
    turn.abort()
    this.approvals.dropSession(sessionId)
    return true
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

  async setLocalModel(model: LocalModel): Promise<InferenceStatus> {
    if (!this.keys.setLocalModel) {
      throw new Error('a hosted workspace has no local Claude Code to pick a model for')
    }
    return this.keys.setLocalModel(model)
  }

  setEvents(events: AgentHostEvents): void {
    this.events = events
  }

  pendingApprovals(): ApprovalRequest[] {
    return this.approvals.list()
  }

  /** What happened, what needs you, what it cost — one read for the Today screen. */
  today(): TodayReport {
    return { turns: recentTurns(this.ws), pending: this.approvals.list(), spend: this.spend() }
  }

  resolveApprovalRequest(
    id: string,
    decision: ApprovalDecision,
    actorId: string | null = null,
  ): void {
    this.approvals.resolve(id, decision, actorId)
  }

  executeAction(input: unknown, caller: Caller = { origin: 'agent' }): Promise<void> {
    return this.desk.execute(input, caller)
  }

  fetchForSheet(url: string, actorId: string | null = null): Promise<string> {
    return this.desk.fetchForSheet(url, actorId)
  }

  isRunning(sessionId: string): boolean {
    return this.turns.has(sessionId)
  }

  /**
   * One user turn: persist, run it on whichever port the credential picks, close
   * it with a receipt. The turn is registered before anything awaits, so Stop
   * works from the first moment — including while the local CLI is probed.
   */
  async prompt(sessionId: string, text: string): Promise<void> {
    if (this.turns.has(sessionId)) {
      throw new Error('A turn is already running in this conversation. Stop it first.')
    }
    const abort = new AbortController()
    const started = Date.now()
    this.turns.set(sessionId, abort)

    try {
      this.record(sessionId, { kind: 'user_message', text })
      const refusal = this.refusal()
      if (refusal) {
        this.fail(sessionId, refusal)
        return
      }

      const credential = await this.keys.resolve()
      if (abort.signal.aborted) {
        this.record(sessionId, { kind: 'turn_done', stopReason: 'cancelled', durationMs: 0 })
        return
      }
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
      updateSession(this.ws, sessionId, { status: 'running' })
      const result = await port.prompt(
        {
          sessionId,
          text,
          credential,
          model: { provider: credential.provider, model: credential.model },
          history: native ? [] : this.history(sessionId),
          resumeToken: native ? getSdkSessionId(this.ws, sessionId) : null,
          signal: abort.signal,
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
      this.turns.delete(sessionId)
      // A turn that ended — however — has nobody left to hear its questions.
      this.approvals.dropSession(sessionId)
    }
  }

  private refusal(): string | null {
    const state = this.breaker()
    if (state.kind === 'open') return null
    if (state.kind === 'paused') return 'Washi is paused for this workspace. Resume it in settings.'
    return state.reason === 'turns'
      ? `Washi has run ${state.turns} turns today, its limit of ${state.turnCap}. Resume it in settings, or wait until tomorrow.`
      : `This workspace has spent $${state.costUsd.toFixed(2)} of its $${state.capUsd} daily stop. Resume or raise it in settings.`
  }

  private close(
    sessionId: string,
    credential: AgentCredential,
    result: TurnResult,
    durationMs: number,
  ) {
    const stopReason = result.cancelled ? 'cancelled' : result.error ? 'error' : 'end_turn'
    this.record(sessionId, {
      kind: 'turn_done',
      stopReason,
      ...(result.error ? { error: result.error } : {}),
      ...(result.costUsd != null ? { costUsd: result.costUsd } : {}),
      billing: result.billing,
      model: result.model ?? credential.model,
      durationMs,
    })
    updateSession(this.ws, sessionId, {
      status: stopReason === 'error' ? 'error' : 'idle',
      ...(result.resumeToken ? { sdkSessionId: result.resumeToken } : {}),
      ...(result.costUsd != null && result.billing === 'metered'
        ? { costUsd: result.costUsd }
        : {}),
    })
    this.budget.charge(result.costUsd, result.billing)
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
