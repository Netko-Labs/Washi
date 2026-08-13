import { query } from '@anthropic-ai/claude-agent-sdk'
import type {
  AgentUpdate,
  ApprovalDecision,
  ApprovalRequest,
  TranscriptEntry,
} from '@washi/desktop-domain'
import {
  appendTurn,
  createApproval,
  getSdkSessionId,
  getSheet,
  resolveApproval,
  setAppMeta,
  updateSession,
} from '@washi/desktop-repository'
import { type HankoHandlers, runAction } from '@washi/hanko'
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
by a component registry — registry components only, JSON-literal props, no expressions or handlers.
Treat each sheet as its own small website: design it like you are building a React app with
Tailwind. Every component takes a \`class\` prop with the FULL Tailwind vocabulary — arbitrary
values, gradients, shadows, transforms, hover: variants (url() is banned). Compose free layouts
from <Box> (div) and <Span>; use semantic blocks (Hero, Callout, Stat, Card, Timeline, Table,
Board, TaskList, Button, Fetch, Tape, Stamp, Chip) where they fit. <Sheet theme={{ preset }}>
offers starting palettes (washi, midnight, broadsheet, sticker, terminal, blueprint) — override
freely with classes. Be visually ambitious and distinct per sheet; vary type, color, and layout.
Always run sheet_check before sheet_create or sheet_replace and fix its diagnostics. Structured
data lives in typed tables via db_* tools; sheets bind to them with bind props. You have no
filesystem or shell — the washi tools are your entire world.`

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

  async executeAction(input: unknown): Promise<void> {
    await runAction(input, this.hankoHandlers())
  }

  /** The sheet <Fetch> component's path — same policy, no approval loop. */
  fetchForSheet(url: string): Promise<string> {
    return guardedFetch(url, currentFetchPolicy())
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
        const source = `<Sheet title=${JSON.stringify(action.title)}>\n  <H1>${action.title}</H1>\n</Sheet>\n`
        const sheet = createSheetFromSource({ title: action.title, source })
        this.events?.openSheet(sheet.id)
      },
      'table.insert': (action) => {
        runMutation({ kind: 'insert', table: action.table, data: action.data })
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
