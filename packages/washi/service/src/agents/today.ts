import type { AgentUpdate } from '@washi/domain'
import { getSheet, getTranscript, listSessions, type Workspace } from '@washi/repository'
import {
  PROMPT_PREVIEW_CHARS,
  plainLine,
  TODAY_TURN_LIMIT,
  TODAY_WINDOW_MS,
  type TurnOutcome,
  type TurnSummary,
} from './lib'

/** HLC strings lead with zero-padded wall-clock ms. */
export function hlcMs(hlc: string): number {
  const wall = Number(hlc.split('-')[0])
  return Number.isFinite(wall) ? wall : 0
}

const field = (input: unknown, key: string): string | null => {
  const value = input && typeof input === 'object' ? (input as Record<string, unknown>)[key] : null
  return typeof value === 'string' && value.trim() ? value : null
}

/** `sheet_create` and `db_trash_table` answer with what they touched, as JSON. */
const createdId = (output: string | undefined): string | null =>
  output?.match(/"id"\s*:\s*"([^"]+)"/)?.[1] ?? null

/** The page a finished write landed on, under the title it bears now. */
function pageOf(
  ws: Workspace,
  call: Extract<AgentUpdate, { kind: 'tool_call' }>,
  result: Extract<AgentUpdate, { kind: 'tool_call_update' }>,
): TurnOutcome | null {
  const made = call.title === 'sheet_create'
  if (result.status !== 'completed' || (!made && call.title !== 'sheet_replace')) return null
  const id = made ? createdId(result.output) : field(call.input, 'id')
  if (!id) return null
  const title = getSheet(ws, id)?.title ?? field(call.input, 'title') ?? 'Untitled'
  return { kind: 'page', touch: made ? 'made' : 'changed', id, title }
}

/** The table a finished `db_trash_table` moved to the trash (D121). */
function trashedTableOf(
  call: Extract<AgentUpdate, { kind: 'tool_call' }>,
  result: Extract<AgentUpdate, { kind: 'tool_call_update' }>,
): TurnOutcome | null {
  if (result.status !== 'completed' || call.title !== 'db_trash_table') return null
  const id = createdId(result.output)
  const name = field(call.input, 'table')
  return id && name ? { kind: 'table', touch: 'trashed', id, name } : null
}

/**
 * Every finished turn in the window, newest first, as a person would retell it:
 * what was asked, what it touched, what it came to, and its receipt. Read from the
 * transcript — the transcript already is the log, so nothing new is stored.
 */
export function recentTurns(
  ws: Workspace,
  viewerId?: string | null,
  now = Date.now(),
  windowMs = TODAY_WINDOW_MS,
  limit = TODAY_TURN_LIMIT,
): TurnSummary[] {
  const since = now - windowMs
  // Keyed by HLC: it orders correctly where two turns share a millisecond.
  const turns: { hlc: string; summary: TurnSummary }[] = []

  for (const session of listSessions(ws, viewerId)) {
    if (hlcMs(session.updatedAt) < since) continue
    let prompt = ''
    let tools: string[] = []
    let said = ''
    let page: TurnOutcome | null = null
    const calls = new Map<string, Extract<AgentUpdate, { kind: 'tool_call' }>>()
    for (const entry of getTranscript(ws, session.id)) {
      const { update } = entry
      if (update.kind === 'user_message') {
        prompt = update.text.slice(0, PROMPT_PREVIEW_CHARS)
        tools = []
        said = ''
        page = null
        calls.clear()
      } else if (update.kind === 'message_chunk') {
        said += update.text
      } else if (update.kind === 'tool_call') {
        calls.set(update.toolCallId, update)
        if (!tools.includes(update.title)) tools.push(update.title)
      } else if (update.kind === 'tool_call_update') {
        const call = calls.get(update.toolCallId)
        page = (call && (pageOf(ws, call, update) ?? trashedTableOf(call, update))) || page
      } else if (update.kind === 'turn_done' && hlcMs(entry.createdAt) >= since) {
        const reply = plainLine(said, PROMPT_PREVIEW_CHARS)
        turns.push({
          hlc: entry.createdAt,
          summary: {
            sessionId: session.id,
            sessionTitle: session.title,
            prompt,
            tools,
            outcome: page ?? (reply ? { kind: 'reply', text: reply } : null),
            receipt: update,
            at: hlcMs(entry.createdAt),
          },
        })
      }
    }
  }

  return turns
    .sort((a, b) => (a.hlc < b.hlc ? 1 : a.hlc > b.hlc ? -1 : 0))
    .slice(0, limit)
    .map((turn) => turn.summary)
}
