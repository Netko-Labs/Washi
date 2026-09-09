import { query } from '@anthropic-ai/claude-agent-sdk'
import type {
  AgentUpdate,
  ApprovalDecision,
  ApprovalRequest,
  CapabilityOrigin,
  TranscriptEntry,
} from '@washi/desktop-domain'
import {
  appendTurn,
  createApproval,
  getSdkSessionId,
  getSheet,
  recordCapability,
  resolveApproval,
  setAppMeta,
  updateSession,
} from '@washi/desktop-repository'
import { checkAction, type HankoHandlers, isReversibleVerb, runAction } from '@washi/hanko'
import { checkUrl, guardedFetch, isPrivateAddress } from '@washi/tsuru'
import { createSheetFromSource } from '../sheets/service'
import { runMutation } from '../tables/service'
import { normalizeMessage, shortToolName } from './normalize'
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
const MAX_BUDGET_USD = 5

const SYSTEM_APPEND = `You are Washi's embedded note agent. Notes are WSX: JSX-shaped data rendered
by a closed component registry — registry primitives only, JSON-literal props, no expressions in
props except the \`expr\` grammar, no handlers. Nothing in a page executes.

COMPONENTS OWN APPEARANCE; PAGES OWN CONTENT AND MEANING. A page cannot name a colour, a font, a
size in px, a margin or a radius. It picks from four enums that every primitive accepts:
  variant  plain · outline · filled · raised · tape
  tone     neutral · accent · info · success · warning · danger   (meaning, never decoration)
  size     sm · md · lg
  emphasis quiet · normal · strong
plus \`span\` (1–12, inside <Grid>) and \`gap\` (tight · normal · loose). The optional \`class\` prop
takes ~40 layout-only tokens (row col wrap grid-2 grid-3 gap-* p-* items-* justify-* text-center
grow none full, and @sm:/@md:/@lg: container prefixes). Anything visual in \`class\` is a validation
error that names the prop to use instead. There is NO Box, NO Span, NO H1/P — use Title, Text, Row,
Stack, Grid, Section, Card.

<Sheet title icon tags feel theme accent state visibility wsx="1"> owns paper, ink, measure, padding
and rhythm. \`feel\` (note · editorial · board · deck) reproportions everything; \`theme\` (washi ·
sumi · aizome · matcha · kobai · kraft · yukiwa · yozora) recolours it. \`icon\` is a registry name
(notebook, rocket, plane, leaf, flag, pen, chart, kanban, calendar …), never an emoji. Never pin
light/dark — readers own it.

Primitives — Frame: Section Row Stack Grid Divider · Text: Title(level) Text(lead) List(marker)/Item
Quote Code Pair(term) Note Source Money(value|expr, currency) + inline Mark Kbd Ref(sheet) Tag ·
Surface: Card(title) Callout(title) Hero(title subtitle align) Figure(https src, alt) · Data out:
Repeat(bind) Table(bind columns) Stat(value|expr label hint trend) Chart(bind kind) Timeline/Step
Progress(value|expr) Badge Avatar · Data in: Field(field kind table row) Board(bind groupBy)
Button(action) Task(row) Switch(state) Slider(state) · Flow: Show(expr) Tabs(labels state)/Tab
Reveal(label) · Kit: Tape Stamp Chip Mascot(mood) · Missing(kind reason) for anything the registry
lacks — it renders as a labelled placeholder and files a request; never fake a capability.

State: <Sheet state={{ local: { tab: 'a' }, stored: { mine: false } }}>. Controls write keys;
\`expr\` reads them. Grammar: arithmetic, comparison (=, !=, <, >=), and/or/not, string join,
aggregates over a table or $scope with optional where — count(tasks where status = 'open'),
sum(tasks.points), avg/min/max — now(), days(a, b). No functions, loops, regex or formatting: expr
computes a number, Money and Text format it. Inside <Repeat bind>, $row.column is in scope for text
and string props ("$row.title", row="$row.id").

Actions are objects, never functions: <Button action={{ verb: 'table.insert', table, data }}>.
Verbs: sheet.open sheet.create table.insert table.update (Field uses it). url.open is denied
from a page. bind is an ink query descriptor { table, where, orderBy, limit, groupBy }.

Budget: ~400 nodes, 8 binds, 24 expressions per sheet — over it, split into linked sheets (<Ref>).
Always run sheet_check before sheet_create or sheet_replace and fix every diagnostic. Structured
data lives in typed tables via db_* tools; sheets bind to them. You have no filesystem or shell —
the washi tools are your entire world.`

export interface AgentHostEvents {
  update: (sessionId: string, entry: TranscriptEntry) => void
  approval: (request: ApprovalRequest) => void
  openSheet: (id: string) => void
}

export class AgentHost {
  private events: AgentHostEvents | null = null
  private pendingApprovals = new Map<string, (decision: ApprovalDecision) => void>()
  private alwaysAllowed = new Map<string, Set<string>>()

  setEvents(events: AgentHostEvents): void {
    this.events = events
  }

  resolveApprovalRequest(id: string, decision: ApprovalDecision): void {
    resolveApproval(id, decision === 'reject_once' ? 'denied' : 'allowed')
    this.pendingApprovals.get(id)?.(decision)
    this.pendingApprovals.delete(id)
  }

  /**
   * The single gate both callers pass through (spec §09 P4). Agent-origin calls
   * were already stamped by `canUseTool`; sheet-origin calls are a user click,
   * which is consent for reversible in-vault verbs and never for anything that
   * leaves the machine (Q13). Every outcome lands in the ledger.
   */
  async executeAction(input: unknown, origin: CapabilityOrigin = 'agent'): Promise<void> {
    const checked = checkAction(input)
    if (!checked.ok) {
      const detail = checked.issues.map((issue) => issue.message).join('; ')
      recordCapability({ origin, subject: 'action.invalid', input, decision: 'denied', detail })
      throw new Error(detail)
    }

    const { verb } = checked.action
    if (origin === 'sheet' && !isReversibleVerb(verb)) {
      const detail = `"${verb}" leaves this machine — a sheet cannot run it without a stamp`
      recordCapability({ origin, subject: verb, input, decision: 'denied', detail })
      throw new Error(detail)
    }

    recordCapability({
      origin,
      subject: verb,
      input,
      decision: origin === 'sheet' ? 'auto' : 'allowed',
    })
    await runAction(checked.action, this.hankoHandlers())
  }

  /** The sheet <Fetch> component's path — same policy, no approval loop. */
  async fetchForSheet(url: string): Promise<string> {
    try {
      const body = await guardedFetch(url, currentFetchPolicy())
      recordCapability({ origin: 'sheet', subject: 'fetch_url', input: { url }, decision: 'auto' })
      return body
    } catch (error) {
      recordCapability({
        origin: 'sheet',
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
    updateSession(sessionId, { status: 'running' })

    const context: ToolContext = { runHankoAction: (action) => this.executeAction(action) }

    try {
      const stream = query({
        prompt: text,
        options: {
          resume: getSdkSessionId(sessionId) ?? undefined,
          mcpServers: { washi: createWashiTools(context) },
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
          maxBudgetUsd: MAX_BUDGET_USD,
          systemPrompt: SYSTEM_APPEND,
          canUseTool: async (toolName, input) => this.gateTool(sessionId, toolName, input),
        },
      })

      for await (const message of stream) {
        if (message.type === 'system' && message.subtype === 'init') {
          updateSession(sessionId, { sdkSessionId: message.session_id })
          continue
        }
        for (const update of normalizeMessage(message)) {
          this.record(sessionId, update)
          if (update.kind === 'tool_call') this.emitProposedDiff(sessionId, update)
          if (update.kind === 'turn_done') {
            updateSession(sessionId, {
              status: update.stopReason === 'error' ? 'error' : 'idle',
              ...(update.costUsd != null ? { costUsd: update.costUsd } : {}),
            })
          }
        }
      }
    } catch (error) {
      this.record(sessionId, { kind: 'turn_done', stopReason: 'error', error: String(error) })
      updateSession(sessionId, { status: 'error' })
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
      const verdict = checkUrl(input.url, currentFetchPolicy())
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
    const request = createApproval(sessionId, toolName, input)
    this.events?.approval(request)
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.pendingApprovals.delete(request.id)
        resolveApproval(request.id, 'denied')
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
    const existing = getSheet(input.id)
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
      const policy = currentFetchPolicy()
      if (!policy.allowedHosts.includes(host)) {
        setAppMeta(TSURU_HOSTS_KEY, JSON.stringify([...policy.allowedHosts, host]))
      }
    } catch {
      // unparseable url — the fetch itself will fail loudly
    }
  }

  private record(sessionId: string, update: AgentUpdate) {
    const entry = appendTurn(sessionId, update)
    this.events?.update(sessionId, entry)
  }

  private hankoHandlers(): HankoHandlers {
    return {
      'sheet.open': (action) => {
        this.events?.openSheet(action.sheet)
      },
      'sheet.create': (action) => {
        const source = `<Sheet title=${JSON.stringify(action.title)} wsx="1">\n  <Title>${action.title}</Title>\n</Sheet>\n`
        const sheet = createSheetFromSource({ title: action.title, source })
        this.events?.openSheet(sheet.id)
      },
      'table.insert': (action) => {
        runMutation({ kind: 'insert', table: action.table, data: action.data })
      },
      'table.update': (action) => {
        runMutation({
          kind: 'update',
          table: action.table,
          where: [{ column: 'id', op: 'eq', value: action.row }],
          data: action.set,
        })
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
