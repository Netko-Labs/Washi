import { query } from '@anthropic-ai/claude-agent-sdk'
import type {
  AgentUpdate,
  ApprovalDecision,
  ApprovalRequest,
  CapabilityOrigin,
  TranscriptEntry,
} from '@washi/domain'
import { checkAction, type HankoHandlers, isReversibleVerb, runAction } from '@washi/hanko'
import { createModelCatalogue, type ModelCatalogue } from '@washi/models'
import {
  acknowledgedSpend,
  appendTurn,
  createApproval,
  getAppMeta,
  getSdkSessionId,
  getSheet,
  getTranscript,
  pauseAgent,
  pausedOn,
  recordCapability,
  recordSpend,
  resolveApproval,
  resumeAgent,
  setAppMeta,
  spendForDay,
  today,
  updateSession,
  type Workspace,
} from '@washi/repository'
import { checkUrl, guardedFetch, isPrivateAddress } from '@washi/tsuru'
import { createSheetFromSource } from '../sheets/service'
import { runMutation } from '../tables/service'
import type { AgentCredential, AgentKeySource, AgentSpendReport, BreakerState } from './lib'
import {
  agentEnv,
  DAILY_CAP_USD_KEY,
  DAILY_TURN_CAP_KEY,
  DEFAULT_DAILY_CAP_USD,
  DEFAULT_DAILY_TURN_CAP,
  MAX_TURN_BUDGET_USD,
} from './lib'
import { normalizeMessage, shortToolName } from './normalize'
import { createAiSdkPort } from './ports'
import { createWashiTools, currentFetchPolicy, type ToolContext, TSURU_HOSTS_KEY } from './tools'

const READ_TOOLS = new Set([
  'sheet_list',
  'sheet_get',
  'sheet_check',
  'sheet_backlinks',
  'search',
  'db_list_tables',
  'db_query',
])

const APPROVAL_TIMEOUT_MS = 5 * 60_000

const SYSTEM_APPEND = `You are Washi's embedded note agent. Notes are WSX: JSX-shaped data rendered
by a component registry — registry components only, JSON-literal props, no expressions or handlers.

THE SHEET IS A BLANK CANVAS. Components ship NO styling of their own: <H1> is a bare h1, <P> a bare
p, <Card> an empty div. Nothing has margins, type, colour or width until you write it. If you do not
style a sheet it will look like unstyled HTML — so design every sheet deliberately, the way you would
build a landing page in React with Tailwind.

Every component takes a \`class\` prop with the FULL Tailwind vocabulary — arbitrary values,
gradients, shadows, transforms, hover: variants, and arbitrary child selectors like
\`[&>div:first-child]:font-bold\` for styling a component's internals. Your class always wins over
any default. Two bans: \`url()\` (styling is never a network capability) and viewport breakpoints —
\`sm:\` \`md:\` \`lg:\` are REJECTED. A sheet renders in a tab, in a 400px side panel, and on small
screens; it must size to its container, not the window. Use CONTAINER queries instead: \`@sm:\`
\`@md:\` \`@lg:\`, which measure the sheet itself. Avoid fixed widths; prefer flex/grid that reflows.

The <Sheet> element owns the page: give it a background, text colour, min-height and padding, e.g.
class="min-h-full bg-[#0b0b12] px-8 py-12 text-zinc-100 @md:px-16". Centre a reading column with an
inner <Box class="mx-auto max-w-2xl">.

Compose free layouts from <Box> (div) and <Span>; use semantic blocks (Hero, Callout, Stat, Card,
Timeline, Table, Board, TaskList, Button, Fetch, Tape, Stamp, Chip, Badge, Avatar, Progress,
Skeleton, Kbd, Tabs/Tab, Accordion/AccordionItem, Dialog, Tooltip) where they fit — they carry
structure and behaviour, you supply the look. Interactivity is declarative: <Sheet state={{ key:
value }}> declares sheet state; <Switch state="key">, <Slider state="key">, and <Tabs state="key">
write to it; <Show when="key" equals={...}> renders conditionally. There are NO hooks, handlers, or
expressions — state is data.

<Sheet theme={{ preset }}> seeds a token palette (washi, midnight, broadsheet, sticker, terminal,
blueprint) that \`bg-card\`, \`text-muted-foreground\` and \`border-border\` then read from. It is
optional and it never lays anything out — layout is always yours.

Be visually ambitious and distinct per sheet; vary type, colour, density and layout. Always run
sheet_check before sheet_create or sheet_replace and fix its diagnostics. Structured data lives in
typed tables via db_* tools; sheets bind to them with bind props. You have no filesystem or shell —
the washi tools are your entire world.`

/** Who is asking. The route stamps this; a caller never supplies its own origin. */
export interface Caller {
  origin: CapabilityOrigin
  actorId?: string | null
}

export interface AgentHostEvents {
  update: (sessionId: string, entry: TranscriptEntry) => void
  approval: (request: ApprovalRequest) => void
  openSheet: (id: string) => void
}

export class AgentHost {
  private events: AgentHostEvents | null = null
  private pendingApprovals = new Map<string, (decision: ApprovalDecision) => void>()
  private alwaysAllowed = new Map<string, Set<string>>()

  private readonly ws: Workspace
  private readonly keys: AgentKeySource
  private readonly catalogue: ModelCatalogue

  constructor(ws: Workspace, keys?: AgentKeySource, catalogue?: ModelCatalogue) {
    this.ws = ws
    this.catalogue = catalogue ?? createModelCatalogue()
    // No resolver means this deployment has no key store — embedded mode, where
    // the machine's own ANTHROPIC_API_KEY is the right and only answer.
    this.keys = keys ?? {
      resolve: async () => {
        const apiKey = process.env.ANTHROPIC_API_KEY
        return apiKey ? ({ apiKey, provider: 'anthropic' } as AgentCredential) : null
      },
    }
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
    const { day, costUsd, turns } = spendForDay(this.ws)
    return { day, costUsd, turns, capUsd: this.dailyCap(), paused: Boolean(pausedOn(this.ws)) }
  }

  resume(): void {
    resumeAgent(this.ws)
  }

  setEvents(events: AgentHostEvents): void {
    this.events = events
  }

  resolveApprovalRequest(id: string, decision: ApprovalDecision): void {
    resolveApproval(this.ws, id, decision === 'reject_once' ? 'denied' : 'allowed')
    this.pendingApprovals.get(id)?.(decision)
    this.pendingApprovals.delete(id)
  }

  /**
   * The single gate both callers pass through (spec §09 P4). Agent-origin calls
   * were already stamped by `canUseTool`; sheet-origin calls are a user click,
   * which is consent for reversible in-vault verbs and never for anything that
   * leaves the machine (Q13). Every outcome lands in the ledger.
   */
  async executeAction(input: unknown, caller: Caller = { origin: 'agent' }): Promise<void> {
    const { origin, actorId = null } = caller
    const checked = checkAction(input)
    if (!checked.ok) {
      const detail = checked.issues.map((issue) => issue.message).join('; ')
      recordCapability(this.ws, {
        origin,
        actorId,
        subject: 'action.invalid',
        input,
        decision: 'denied',
        detail,
      })
      throw new Error(detail)
    }

    const { verb } = checked.action
    if (origin === 'sheet' && !isReversibleVerb(verb)) {
      const detail = `"${verb}" leaves this machine — a sheet cannot run it without a stamp`
      recordCapability(this.ws, {
        origin,
        actorId,
        subject: verb,
        input,
        decision: 'denied',
        detail,
      })
      throw new Error(detail)
    }

    recordCapability(this.ws, {
      origin,
      actorId,
      subject: verb,
      input,
      decision: origin === 'sheet' ? 'auto' : 'allowed',
    })
    await runAction(checked.action, this.hankoHandlers())
  }

  /** The sheet <Fetch> component's path — same policy, no approval loop. */
  async fetchForSheet(url: string, actorId: string | null = null): Promise<string> {
    try {
      const body = await guardedFetch(url, currentFetchPolicy(this.ws))
      recordCapability(this.ws, {
        origin: 'sheet',
        actorId,
        subject: 'fetch_url',
        input: { url },
        decision: 'auto',
      })
      return body
    } catch (error) {
      recordCapability(this.ws, {
        origin: 'sheet',
        actorId,
        subject: 'fetch_url',
        input: { url },
        decision: 'denied',
        detail: String(error),
      })
      throw error
    }
  }

  /** One user turn: persist, stream the SDK, emit + persist every update. */
  async prompt(sessionId: string, text: string): Promise<void> {
    this.record(sessionId, { kind: 'user_message', text })

    const state = this.breaker()
    if (state.kind !== 'open') {
      const detail =
        state.kind === 'paused'
          ? 'The agent is paused for this workspace. Resume it in settings.'
          : `This workspace has spent ${state.costUsd.toFixed(2)} of its ${state.capUsd} daily cap. Raise the cap or resume tomorrow.`
      this.record(sessionId, { kind: 'turn_done', stopReason: 'error', error: detail })
      updateSession(this.ws, sessionId, { status: 'error' })
      return
    }

    const credential = await this.keys.resolve()
    if (!credential) {
      const detail = 'No API key for this workspace. Add one in settings before asking Washi.'
      this.record(sessionId, { kind: 'turn_done', stopReason: 'error', error: detail })
      updateSession(this.ws, sessionId, { status: 'error' })
      return
    }

    updateSession(this.ws, sessionId, { status: 'running' })

    // Two ports, one vocabulary (§05). Anthropic keeps the native Claude Agent
    // SDK path, which resumes sessions server-side; anything else goes through
    // the AI SDK, where Washi owns the history itself.
    if (credential.provider !== 'anthropic') {
      await this.promptViaPort(sessionId, text, credential)
      return
    }

    const apiKey = credential.apiKey

    const context: ToolContext = { runHankoAction: (action) => this.executeAction(action) }

    try {
      const stream = query({
        prompt: text,
        options: {
          resume: getSdkSessionId(this.ws, sessionId) ?? undefined,
          mcpServers: { washi: createWashiTools(this.ws, context) },
          disallowedTools: [
            'Bash',
            'BashOutput',
            'Edit',
            'Glob',
            'Grep',
            'KillShell',
            'NotebookEdit',
            'Read',
            'Task',
            'WebFetch',
            'WebSearch',
            'Write',
          ],
          settingSources: [],
          maxBudgetUsd: MAX_TURN_BUDGET_USD,
          // Replaces the subprocess env rather than merging — see agentEnv.
          env: agentEnv(apiKey),
          systemPrompt: SYSTEM_APPEND,
          canUseTool: async (toolName, input) => this.gateTool(sessionId, toolName, input),
        },
      })

      for await (const message of stream) {
        if (message.type === 'system' && message.subtype === 'init') {
          updateSession(this.ws, sessionId, { sdkSessionId: message.session_id })
          continue
        }
        for (const update of normalizeMessage(message)) {
          this.record(sessionId, update)
          if (update.kind === 'tool_call') this.emitProposedDiff(sessionId, update)
          if (update.kind === 'turn_done') {
            updateSession(this.ws, sessionId, {
              status: update.stopReason === 'error' ? 'error' : 'idle',
              ...(update.costUsd != null ? { costUsd: update.costUsd } : {}),
            })
            // The stored cost used to be written and never read. It is the cap now.
            if (update.costUsd != null) {
              const total = recordSpend(this.ws, update.costUsd)
              const budget = this.dailyCap() + acknowledgedSpend(this.ws)
              if (total.costUsd >= budget) pauseAgent(this.ws)
            }
          }
        }
      }
    } catch (error) {
      this.record(sessionId, { kind: 'turn_done', stopReason: 'error', error: String(error) })
      updateSession(this.ws, sessionId, { status: 'error' })
    }
  }

  /** The provider-agnostic path. Same tools, same desk, different vendor. */
  private async promptViaPort(
    sessionId: string,
    text: string,
    credential: AgentCredential,
  ): Promise<void> {
    const port = createAiSdkPort({
      ws: this.ws,
      catalogue: this.catalogue,
      instructions: SYSTEM_APPEND,
      runHankoAction: (action) => this.executeAction(action),
      gate: {
        isRead: (name) => READ_TOOLS.has(name),
        approve: async (session, toolName, input) => {
          if (this.alwaysAllowed.get(session)?.has(toolName)) return true
          const decision = await this.requestApproval(session, toolName, input)
          if (decision === 'allow_always') {
            const set = this.alwaysAllowed.get(session) ?? new Set()
            set.add(toolName)
            this.alwaysAllowed.set(session, set)
          }
          return decision !== 'reject_once'
        },
      },
    })

    try {
      const history = getTranscript(this.ws, sessionId)
        .flatMap((entry) =>
          entry.update.kind === 'user_message'
            ? [{ role: 'user' as const, text: entry.update.text }]
            : [],
        )
        .slice(0, -1)

      const result = await port.prompt(
        {
          sessionId,
          text,
          apiKey: credential.apiKey,
          model: { provider: credential.provider, model: credential.model },
          history,
        },
        (update) => this.record(sessionId, update),
      )
      this.record(sessionId, { kind: 'turn_done', stopReason: 'end_turn' })
      updateSession(this.ws, sessionId, {
        status: 'idle',
        ...(result.costUsd != null ? { costUsd: result.costUsd } : {}),
      })
      const total = recordSpend(this.ws, result.costUsd)
      const overSpend = total.costUsd >= this.dailyCap() + acknowledgedSpend(this.ws)
      if (overSpend || total.turns >= this.dailyTurnCap()) pauseAgent(this.ws)
    } catch (error) {
      this.record(sessionId, { kind: 'turn_done', stopReason: 'error', error: String(error) })
      updateSession(this.ws, sessionId, { status: 'error' })
    }
  }

  /** Reads pass; writes and off-policy fetches stop at the hanko desk. */
  private async gateTool(
    sessionId: string,
    fullName: string,
    input: Record<string, unknown>,
  ): Promise<
    | { behavior: 'allow'; updatedInput: Record<string, unknown> }
    | { behavior: 'deny'; message: string }
  > {
    if (!fullName.startsWith('mcp__washi__')) {
      return { behavior: 'deny', message: 'only washi tools are available in this app' }
    }
    const name = shortToolName(fullName)
    if (READ_TOOLS.has(name)) return { behavior: 'allow', updatedInput: input }

    if (name === 'fetch_url' && typeof input.url === 'string') {
      const verdict = checkUrl(input.url, currentFetchPolicy(this.ws))
      if (verdict.ok) return { behavior: 'allow', updatedInput: input }
      if (!verdict.needsApproval) return { behavior: 'deny', message: verdict.reason }
    }

    if (this.alwaysAllowed.get(sessionId)?.has(name)) {
      return { behavior: 'allow', updatedInput: input }
    }

    const decision = await this.requestApproval(sessionId, name, input)
    if (decision === 'reject_once') {
      return { behavior: 'deny', message: 'the user declined this action' }
    }
    if (decision === 'allow_always') {
      if (name === 'fetch_url' && typeof input.url === 'string') {
        this.persistFetchHost(input.url)
      } else {
        const set = this.alwaysAllowed.get(sessionId) ?? new Set()
        set.add(name)
        this.alwaysAllowed.set(sessionId, set)
      }
    }
    return { behavior: 'allow', updatedInput: input }
  }

  private requestApproval(
    sessionId: string,
    toolName: string,
    input: unknown,
  ): Promise<ApprovalDecision> {
    const request = createApproval(this.ws, sessionId, toolName, input)
    this.events?.approval(request)
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.pendingApprovals.delete(request.id)
        resolveApproval(this.ws, request.id, 'denied')
        resolve('reject_once')
      }, APPROVAL_TIMEOUT_MS)
      this.pendingApprovals.set(request.id, (decision) => {
        clearTimeout(timeout)
        resolve(decision)
      })
    })
  }

  /** sheet_replace proposals render as diffs in the transcript (spec §6). */
  private emitProposedDiff(sessionId: string, call: Extract<AgentUpdate, { kind: 'tool_call' }>) {
    if (call.title !== 'sheet_replace') return
    const input = call.input as { id?: string; source?: string } | undefined
    if (!input?.id || typeof input.source !== 'string') return
    const existing = getSheet(this.ws, input.id)
    if (!existing) return
    this.record(sessionId, {
      kind: 'tool_call_update',
      toolCallId: call.toolCallId,
      status: 'in_progress',
      diff: { path: existing.title, oldText: existing.source, newText: input.source },
    })
  }

  private persistFetchHost(rawUrl: string) {
    try {
      const host = new URL(rawUrl).hostname
      const policy = currentFetchPolicy(this.ws)
      if (!policy.allowedHosts.includes(host)) {
        setAppMeta(this.ws, TSURU_HOSTS_KEY, JSON.stringify([...policy.allowedHosts, host]))
      }
    } catch {
      // unparseable url — the fetch itself will fail loudly
    }
  }

  private record(sessionId: string, update: AgentUpdate) {
    const entry = appendTurn(this.ws, sessionId, update)
    this.events?.update(sessionId, entry)
  }

  private hankoHandlers(): HankoHandlers {
    return {
      'sheet.open': (action) => {
        this.events?.openSheet(action.sheet)
      },
      'sheet.create': (action) => {
        const source = `<Sheet title=${JSON.stringify(action.title)}>\n  <H1>${action.title}</H1>\n</Sheet>\n`
        const sheet = createSheetFromSource(this.ws, { title: action.title, source })
        this.events?.openSheet(sheet.id)
      },
      'table.insert': (action) => {
        runMutation(this.ws, { kind: 'insert', table: action.table, data: action.data })
      },
      'url.open': (action) => {
        const url = new URL(action.url)
        if (url.protocol !== 'https:' || isPrivateAddress(url.hostname)) {
          throw new Error('url.open takes public https URLs only')
        }
        Bun.spawn([process.platform === 'darwin' ? 'open' : 'xdg-open', url.toString()])
      },
    }
  }
}
