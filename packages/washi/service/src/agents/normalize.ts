import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { AgentUpdate } from '@washi/domain'

const TOOL_KINDS: Record<string, Extract<AgentUpdate, { kind: 'tool_call' }>['toolKind']> = {
  sheet_list: 'read',
  sheet_get: 'read',
  sheet_check: 'read',
  sheet_backlinks: 'read',
  sheet_create: 'edit',
  sheet_replace: 'edit',
  search: 'search',
  db_list_tables: 'read',
  db_query: 'search',
  db_history: 'search',
  db_define: 'edit',
  db_mutate: 'edit',
  fetch_url: 'fetch',
  action_run: 'execute',
}

export function shortToolName(full: string): string {
  return full.replace(/^mcp__washi__/, '')
}

function blockText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((block) => {
      const item = block as { type?: string; text?: string }
      return item.type === 'text' ? (item.text ?? '') : ''
    })
    .join('')
}

/** SDK stream message → zero or more ACP-shaped transcript updates. */
export function normalizeMessage(message: SDKMessage): AgentUpdate[] {
  if (message.type === 'assistant') {
    const updates: AgentUpdate[] = []
    for (const block of message.message.content) {
      if (block.type === 'text' && block.text.trim()) {
        updates.push({ kind: 'message_chunk', text: block.text })
      }
      if (block.type === 'tool_use') {
        const name = shortToolName(block.name)
        updates.push({
          kind: 'tool_call',
          toolCallId: block.id,
          title: name,
          toolKind: TOOL_KINDS[name] ?? 'other',
          status: 'in_progress',
          input: block.input,
        })
      }
    }
    return updates
  }

  if (message.type === 'user') {
    const content = (message.message as { content?: unknown }).content
    if (!Array.isArray(content)) return []
    const updates: AgentUpdate[] = []
    for (const block of content) {
      const item = block as {
        type?: string
        tool_use_id?: string
        is_error?: boolean
        content?: unknown
      }
      if (item.type === 'tool_result' && item.tool_use_id) {
        updates.push({
          kind: 'tool_call_update',
          toolCallId: item.tool_use_id,
          status: item.is_error ? 'failed' : 'completed',
          output: blockText(item.content).slice(0, 20_000),
        })
      }
    }
    return updates
  }

  if (message.type === 'result') {
    const costUsd = 'total_cost_usd' in message ? message.total_cost_usd : undefined
    // A signed-out CLI ends in `success` with is_error set and the reason in `result`.
    const failed = message.subtype !== 'success' || message.is_error
    const reason =
      message.subtype === 'success'
        ? message.result
        : [message.subtype, ...(message.errors ?? [])].join(': ')
    return [
      {
        kind: 'turn_done',
        stopReason: failed ? 'error' : 'end_turn',
        costUsd,
        error: failed ? reason || message.subtype : undefined,
      },
    ]
  }

  return []
}

/** A sheet_replace call, restated as the diff a person reviews before approving it. */
export function proposedDiff(
  update: AgentUpdate,
  sheet: (id: string) => { title: string; source: string } | null | undefined,
): AgentUpdate | null {
  if (update.kind !== 'tool_call' || update.title !== 'sheet_replace') return null
  const input = update.input as { id?: string; source?: string } | undefined
  if (!input?.id || typeof input.source !== 'string') return null
  const existing = sheet(input.id)
  if (!existing) return null
  return {
    kind: 'tool_call_update',
    toolCallId: update.toolCallId,
    status: 'in_progress',
    diff: { path: existing.title, oldText: existing.source, newText: input.source },
  }
}
