import type { TranscriptEntry } from '@washi/domain'
import { AGENT_PRESENCE_TTL_MS, type EventBus, type PresenceBoard } from '@washi/trpc'

const PAGE_WRITES = new Set(['sheet_create', 'sheet_replace', 'sheet_delete'])
const DATA_WRITES = new Set(['db_define', 'db_link_column', 'db_mutate', 'action_run'])

/**
 * Washi is a collaborator in the room: it shows up on the page it is writing, and when a write
 * lands, everyone looking refetches — the same as when a teammate saves.
 */
export function watchAgentWrites(workspaceId: string, events: EventBus, presence: PresenceBoard) {
  const calls = new Map<string, { name: string; sheetId: string | null }>()

  return (entry: TranscriptEntry) => {
    const update = entry.update
    if (update.kind === 'tool_call') {
      const input = update.input as { id?: unknown } | undefined
      const sheetId = typeof input?.id === 'string' ? input.id : null
      calls.set(update.toolCallId, { name: update.title, sheetId })
      if (update.title === 'sheet_replace' && sheetId) {
        presence.touch(
          workspaceId,
          sheetId,
          { id: 'washi', name: 'Washi', editing: true, agent: true },
          AGENT_PRESENCE_TTL_MS,
        )
      }
      return
    }
    if (update.kind !== 'tool_call_update' || update.status !== 'completed') return
    const call = calls.get(update.toolCallId)
    calls.delete(update.toolCallId)
    if (!call) return
    if (PAGE_WRITES.has(call.name) || call.name === 'action_run') {
      events.emit('workspaceChanged', { workspaceId, kind: 'page', id: call.sheetId })
    }
    if (DATA_WRITES.has(call.name)) {
      events.emit('workspaceChanged', { workspaceId, kind: 'data', id: null })
    }
  }
}
