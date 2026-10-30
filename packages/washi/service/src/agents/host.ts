// conventions: >300 lines — one AgentHost class; split when next touched
import type {
  AgentSession,
  AgentUpdate,
  ApprovalDecision,
  ApprovalRequest,
  AttachmentRef,
  EnabledModel,
  Member,
  Viewer,
} from '@washi/domain'
import { createModelCatalogue, type ModelCatalogue } from '@washi/models'
import {
  appendTurn,
  deleteSession,
  expirePendingApprovals,
  type FileStore,
  failInterruptedSessions,
  getSdkSessionId,
  getSession,
  getSheet,
  getTranscript,
  updateSession,
  type Workspace,
} from '@washi/repository'
import { NOBODY, SheetNotFoundError } from '../sheets/access'
import { ApprovalDesk } from './approvals'
import { DailyBudget } from './budget'
import { CapabilityDesk } from './desk'
import { ChatMoveError, moveChat } from './handover'
import { conversationHistory } from './history'
import { createEmbeddedKeySource } from './inference'
import { instructionsFor } from './instructions'
import type {
  AgentActivity,
  AgentCredential,
  AgentHostEvents,
  AgentKeySource,
  AgentSettingsReport,
  AgentSpendReport,
  ApprovalMode,
  AskOptions,
  BreakerState,
  Caller,
  Effort,
  InferencePreference,
  InferenceStatus,
  LocalModel,
  ResumeBy,
  RunningTurn,
  SearchKeyLookup,
  SessionOptions,
  TodayReport,
  TurnLimits,
} from './lib'
import {
  IMAGE_TYPES,
  MAX_INLINE_FILE_BYTES,
  SDK_EFFORT,
  TURN_GRACE_MS,
  TURN_INTERRUPTED,
  TURN_QUIET_MS,
  TURN_STALLED,
  titleFrom,
  wordsOf,
} from './lib'
import { proposedDiff } from './normalize'
import {
  type AgentPort,
  createAiSdkPort,
  createClaudeSdkPort,
  type HandoverResult,
  type TurnResult,
} from './ports'
import { AgentPreferences } from './preferences'
import { RoutineBook } from './routines'
import { recentTurns } from './today'
import { TurnAbandonedError, TurnWatchdog } from './watchdog'

export class AgentHost {
  private events: AgentHostEvents | null = null
  private people: (() => Promise<Member[]>) | null = null
  private search: SearchKeyLookup | null = null
  private files: FileStore | null = null
  /** One per running turn, keyed by session — Stop aborts exactly that turn. */
  private readonly turns = new Map<string, RunningTurn>()
  private limits: TurnLimits = { quietMs: TURN_QUIET_MS, graceMs: TURN_GRACE_MS }

  private readonly ws: Workspace
  private readonly keys: AgentKeySource
  private readonly desk: CapabilityDesk
  private readonly approvals: ApprovalDesk
  private readonly budget: DailyBudget
  private readonly prefs: AgentPreferences
  readonly routines: RoutineBook
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
    this.prefs = new AgentPreferences(ws)
    this.routines = new RoutineBook(ws, {
      prompt: (sessionId, text) => this.prompt(sessionId, text),
      isRunning: (sessionId) => this.isRunning(sessionId),
      waitLonger: (sessionId) => this.approvals.waitLonger(sessionId),
      canStart: () => this.budget.refusal() === null,
    })
    expirePendingApprovals(ws)
    for (const sessionId of failInterruptedSessions(ws)) {
      appendTurn(ws, sessionId, { kind: 'turn_done', stopReason: 'error', error: TURN_INTERRUPTED })
    }

    const runHankoAction = (action: unknown) => this.desk.execute(action)
    const openSheet = (id: string) => this.events?.openSheet(id)
    const listPeople = () => this.people?.() ?? Promise.resolve([])
    const searchKey = () => this.search?.() ?? Promise.resolve(null)
    const models = catalogue ?? createModelCatalogue()
    this.claudePort = createClaudeSdkPort({
      ws,
      catalogue: models,
      instructions: () => instructionsFor(ws),
      runHankoAction,
      openSheet,
      listPeople,
      searchKey,
      canUseTool: (sessionId, name, input) => this.approvals.gateSdkTool(sessionId, name, input),
      fetchGrant: (sessionId, url) => this.approvals.takeFetchGrant(sessionId, url),
    })
    this.aiSdkPort = createAiSdkPort({
      ws,
      instructions: () => instructionsFor(ws),
      runHankoAction,
      openSheet,
      listPeople,
      searchKey,
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

  approvalMode(): ApprovalMode {
    return this.approvals.mode()
  }

  setApprovalMode(mode: ApprovalMode): ApprovalMode {
    return this.approvals.setMode(mode)
  }

  setYoloAllowed(allowed: boolean): AgentSettingsReport {
    this.approvals.setYoloAllowed(allowed)
    return this.settings()
  }

  setDailyCap(capUsd: number): AgentSpendReport {
    return this.budget.setCap(capUsd)
  }

  setTurnCap(turnCap: number): AgentSpendReport {
    return this.budget.setTurnCap(turnCap)
  }

  pause(): AgentSpendReport {
    return this.budget.pause()
  }

  resume(): void {
    this.budget.resume()
  }

  settings(): AgentSettingsReport {
    return {
      capUsd: this.budget.capUsd(),
      turnCap: this.budget.turnCap(),
      resumeBy: this.prefs.resumeBy(),
      effort: this.prefs.effort(),
      enabledModels: this.prefs.enabledModels(),
      zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      approvalMode: this.approvals.mode(),
      yoloAllowed: this.approvals.yoloAllowed(),
    }
  }

  setResumeBy(resumeBy: ResumeBy): AgentSettingsReport {
    this.prefs.setResumeBy(resumeBy)
    return this.settings()
  }

  setDefaultEffort(effort: Effort): AgentSettingsReport {
    this.prefs.setEffort(effort)
    return this.settings()
  }

  setEnabledModels(models: EnabledModel[] | null): AgentSettingsReport {
    this.prefs.setEnabledModels(models)
    return this.settings()
  }

  /** Stop the session's running turn. Its open approvals are answered "no" on the way out. */
  cancel(sessionId: string): boolean {
    const turn = this.turns.get(sessionId)
    if (!turn) return false
    turn.abort.abort()
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

  /** The runtime knows the members; the host only asks when Washi needs a name. */
  setPeople(people: () => Promise<Member[]>): void {
    this.people = people
  }

  setSearchKey(lookup: SearchKeyLookup): void {
    this.search = lookup
  }

  pendingApprovals(): ApprovalRequest[] {
    return this.approvals.list()
  }

  /** What happened, what needs you, what it cost — one read for the Today screen. */
  today(viewerId?: string | null): TodayReport {
    return {
      turns: recentTurns(this.ws, viewerId),
      pending: this.approvals.list(),
      spend: this.spend(),
    }
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

  /** Uploads attached to an ask come from here; the runtime hands it over with the workspace. */
  setFiles(files: FileStore): void {
    this.files = files
  }

  /** `actorId` is who asks: a conversation's approvals are its starter's alone (D115). */
  setSessionOptions(
    sessionId: string,
    options: SessionOptions,
    actorId: string | null = null,
  ): AgentSession | null {
    if (options.approvals !== undefined) {
      this.approvals.checkSessionApprovals(sessionId, options.approvals, actorId ?? '')
    }
    updateSession(this.ws, sessionId, {
      model: options.model,
      effort: options.effort,
      approvals: options.approvals,
    })
    return getSession(this.ws, sessionId)
  }

  renameSession(sessionId: string, title: string): AgentSession | null {
    updateSession(this.ws, sessionId, { title: title.trim().slice(0, 120) })
    return getSession(this.ws, sessionId)
  }

  /**
   * Moves a chat to a page, or Home (D110): a divider lands in its transcript and its list
   * refetches. Washi's move also sends that chat's person to the page.
   */
  moveSession(
    sessionId: string,
    sheetId: string | null,
    viewer: Viewer,
    by: 'washi' | 'person' = 'person',
    note?: string,
  ): AgentSession | null {
    const marker = moveChat(this.ws, sessionId, sheetId, viewer, by, note)
    if (marker) {
      this.record(sessionId, marker)
      this.events?.sessionChanged?.(sessionId)
      if (by === 'washi' && sheetId) this.events?.openSheet(sheetId, sessionId)
    }
    return getSession(this.ws, sessionId)
  }

  private handover(
    sessionId: string,
    viewer: Viewer,
    sheetId: string,
    note?: string,
  ): HandoverResult {
    try {
      this.moveSession(sessionId, sheetId, viewer, 'washi', note)
      return { ok: true, page: getSheet(this.ws, sheetId)?.title ?? sheetId }
    } catch (error) {
      if (error instanceof SheetNotFoundError)
        return { ok: false, reason: `no page ${sheetId} that this person can read` }
      if (error instanceof ChatMoveError)
        return { ok: false, reason: 'this conversation is nobody’s own, so it stays where it runs' }
      throw error
    }
  }

  /** Refused while a turn runs: the transcript it is writing has nowhere to go. */
  deleteSession(sessionId: string): void {
    if (this.turns.has(sessionId)) {
      throw new Error('This conversation is still running. Stop it first.')
    }
    deleteSession(this.ws, sessionId)
  }

  /**
   * One user turn: persist, run it on whichever port the credential picks, close
   * it with a receipt. The turn is registered before anything awaits, so Stop
   * works from the first moment — including while the local CLI is probed. Every
   * turn ends in exactly one `turn_done`, even one whose port never returns (D114).
   */
  async prompt(sessionId: string, text: string, ask: AskOptions = {}): Promise<void> {
    if (this.turns.has(sessionId)) {
      throw new Error('A turn is already running in this conversation. Stop it first.')
    }
    const turn: RunningTurn = { abort: new AbortController(), ended: false }
    const watchdog = new TurnWatchdog(turn.abort, this.limits, () =>
      this.approvals.isWaitingIn(sessionId),
    )
    const started = Date.now()
    this.turns.set(sessionId, turn)

    try {
      await watchdog.guard(this.run(sessionId, text, ask, turn, watchdog, started))
    } catch (error) {
      if (turn.ended) return
      const durationMs = Date.now() - started
      if (error instanceof TurnAbandonedError && !watchdog.stalled) {
        this.stop(sessionId, turn, durationMs)
      } else {
        const words = watchdog.stalled ? TURN_STALLED : wordsOf(error)
        this.record(
          sessionId,
          { kind: 'turn_done', stopReason: 'error', error: words, durationMs },
          turn,
        )
        updateSession(this.ws, sessionId, { status: 'error' })
      }
    } finally {
      turn.ended = true
      this.turns.delete(sessionId)
      // A turn that ended — however — has nobody left to hear its questions.
      this.approvals.dropSession(sessionId)
    }
  }

  private async run(
    sessionId: string,
    text: string,
    ask: AskOptions,
    turn: RunningTurn,
    watchdog: TurnWatchdog,
    started: number,
  ): Promise<void> {
    const attachments = ask.attachments ?? []
    const session = getSession(this.ws, sessionId)
    // A conversation is named by its first ask until Washi names it better.
    if (
      session &&
      /^Session \d+$/.test(session.title) &&
      getTranscript(this.ws, sessionId).length === 0
    ) {
      updateSession(this.ws, sessionId, { title: titleFrom(text) })
    }
    this.record(sessionId, {
      kind: 'user_message',
      text,
      ...(attachments.length > 0 && { attachments }),
    })
    // From the ask on: a process that dies before the port starts still leaves a receipt at boot.
    updateSession(this.ws, sessionId, { status: 'running' })
    const { prompt, images } = await this.compose(text, attachments)
    const refusal = this.budget.refusal()
    if (refusal) {
      this.fail(sessionId, refusal, turn)
      return
    }

    const credential = await this.keys.resolve()
    if (turn.abort.signal.aborted) {
      if (watchdog.stalled) this.fail(sessionId, TURN_STALLED, turn)
      else this.stop(sessionId, turn, 0)
      return
    }
    if (!credential) {
      const status = await this.keys.status()
      this.fail(sessionId, status.missing ?? 'Nothing can run this turn yet.', turn)
      return
    }

    // Two ports, one vocabulary (§05). Anthropic keeps the native Claude Agent
    // SDK path, which resumes sessions itself; anything else goes through the
    // AI SDK, where Washi owns the history.
    const native = credential.provider === 'anthropic'
    const port = native ? this.claudePort : this.aiSdkPort
    const result = await port.prompt(
      {
        sessionId,
        text: prompt,
        credential,
        model: { provider: credential.provider, model: session?.model ?? credential.model },
        effort: SDK_EFFORT[session?.effort ?? this.prefs.effort()],
        images,
        viewer: ask.viewer,
        setTitle: (title) => {
          updateSession(this.ws, sessionId, { title })
          this.events?.sessionChanged?.(sessionId)
        },
        handover: (sheetId, note) => this.handover(sessionId, ask.viewer ?? NOBODY, sheetId, note),
        history: native ? [] : conversationHistory(getTranscript(this.ws, sessionId)),
        resumeToken: native ? getSdkSessionId(this.ws, sessionId) : null,
        signal: turn.abort.signal,
        onActivity: watchdog.heard,
      },
      (update) => {
        watchdog.heard()
        this.emit(sessionId, update, turn)
      },
    )
    const ended = watchdog.stalled ? { ...result, cancelled: false, error: TURN_STALLED } : result
    this.close(sessionId, credential, ended, Date.now() - started, turn)
  }

  /** Pages ride by id — Washi reads them; text files ride inline; pictures ride as image blocks. */
  private async compose(text: string, attachments: AttachmentRef[]) {
    const lines: string[] = []
    const images: { mime: string; base64: string }[] = []
    for (const attachment of attachments) {
      if (attachment.kind === 'page') {
        const sheet = getSheet(this.ws, attachment.id)
        if (sheet)
          lines.push(
            `Attached page "${sheet.title}" (id ${sheet.id}): read it with sheet_get before answering.`,
          )
        continue
      }
      const found = await this.files?.get(attachment.id)
      if (!found) continue
      if (IMAGE_TYPES.has(found.file.mime)) {
        images.push({ mime: found.file.mime, base64: Buffer.from(found.bytes).toString('base64') })
        lines.push(`Attached picture "${found.file.name}".`)
      } else if (found.bytes.byteLength <= MAX_INLINE_FILE_BYTES) {
        lines.push(
          `Attached file "${found.file.name}":\n\`\`\`\n${new TextDecoder().decode(found.bytes)}\n\`\`\``,
        )
      } else {
        lines.push(
          `Attached file "${found.file.name}" is too large to read here (${found.file.size} bytes).`,
        )
      }
    }
    return { prompt: lines.length > 0 ? `${lines.join('\n')}\n\n${text}` : text, images }
  }

  /** A turn given up on still charges what it spent when it finally returns; nothing else lands. */
  private close(
    sessionId: string,
    credential: AgentCredential,
    result: TurnResult,
    durationMs: number,
    turn: RunningTurn,
  ) {
    if (turn.ended) {
      this.budget.charge(result.costUsd, result.billing)
      return
    }
    const stopReason = result.cancelled ? 'cancelled' : result.error ? 'error' : 'end_turn'
    this.record(
      sessionId,
      {
        kind: 'turn_done',
        stopReason,
        ...(result.error ? { error: result.error } : {}),
        ...(result.costUsd != null ? { costUsd: result.costUsd } : {}),
        billing: result.billing,
        model: result.model ?? credential.model,
        durationMs,
      },
      turn,
    )
    updateSession(this.ws, sessionId, {
      status: stopReason === 'error' ? 'error' : 'idle',
      ...(result.resumeToken ? { sdkSessionId: result.resumeToken } : {}),
      ...(result.costUsd != null && result.billing === 'metered'
        ? { costUsd: result.costUsd }
        : {}),
    })
    this.budget.charge(result.costUsd, result.billing)
  }

  private stop(sessionId: string, turn: RunningTurn, durationMs: number) {
    if (turn.ended) return
    this.record(sessionId, { kind: 'turn_done', stopReason: 'cancelled', durationMs }, turn)
    updateSession(this.ws, sessionId, { status: 'idle' })
  }

  private fail(sessionId: string, error: string, turn: RunningTurn) {
    if (turn.ended) return
    this.record(sessionId, { kind: 'turn_done', stopReason: 'error', error }, turn)
    updateSession(this.ws, sessionId, { status: 'error' })
  }

  /** sheet_replace proposals also render as diffs in the transcript (spec §6). */
  private emit(sessionId: string, update: AgentUpdate, turn: RunningTurn) {
    this.record(sessionId, update, turn)
    const diff = proposedDiff(update, (id) => getSheet(this.ws, id))
    if (diff) this.record(sessionId, diff, turn)
  }

  /** A turn's own updates stop at its `turn_done`: one receipt, nothing after it. */
  private record(sessionId: string, update: AgentUpdate, turn?: RunningTurn) {
    if (turn?.ended) return
    if (turn && update.kind === 'turn_done') turn.ended = true
    const entry = appendTurn(this.ws, sessionId, update)
    this.events?.update(sessionId, entry)
  }
}
