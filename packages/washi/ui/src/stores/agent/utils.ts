import type { AgentSession, ApprovalRequest, TranscriptEntry } from '@washi/domain'
import type { TabKey } from '../view/types'
import type { AgentState, ChatScope } from './types'

/** Header/panel mascot state from the transcript tail (design: agent status lives in chrome). */
export function mascotStateFor(
  transcript: TranscriptEntry[],
  running: boolean,
  approvals: ApprovalRequest[],
): 'idle' | 'reading' | 'thinking' | 'writing' | 'suggesting' | 'done' | 'flagged' {
  if (approvals.length > 0) return 'suggesting'
  const last = transcript.at(-1)?.update
  if (!running) {
    if (last?.kind === 'turn_done') return last.stopReason === 'error' ? 'flagged' : 'done'
    return 'idle'
  }
  for (let index = transcript.length - 1; index >= 0; index--) {
    const update = transcript[index]?.update
    if (update?.kind === 'tool_call') {
      if (update.toolKind === 'read' || update.toolKind === 'search' || update.toolKind === 'fetch')
        return 'reading'
      if (update.toolKind === 'edit') return 'writing'
      return 'thinking'
    }
    if (update?.kind === 'user_message') break
  }
  return 'thinking'
}

/**
 * A page tab is that page's scope; every other screen is Home. The chats screens answer
 * undefined: the chat route picks the chat there, and the panel follows the chat.
 */
export function scopeOfTab(tab: TabKey | null): ChatScope | undefined {
  if (tab === 'view:chats') return undefined
  return tab?.startsWith('note:') ? tab.slice(5) : null
}

export function scopeOfSession(session: AgentSession): ChatScope {
  return session.anchor?.sheetId ?? null
}

/** A person's own chats only (D67): a routine's runs are the workspace's, never a place's. */
export function isInScope(session: AgentSession, scope: ChatScope): boolean {
  return session.createdBy !== null && scopeOfSession(session) === scope
}

/** The chat last picked here if it still lives here, else the newest here, else none (a draft). */
export function pickChat(
  sessions: AgentSession[],
  scope: ChatScope,
  remembered: string | null,
): string | null {
  const here = sessions.filter((session) => isInScope(session, scope))
  return (here.find((session) => session.id === remembered) ?? here[0])?.id ?? null
}

/** The place the panel shows: its chat's, or the draft's. */
export function shownScope(state: Pick<AgentState, 'sessions' | 'activeSessionId' | 'scope'>) {
  const active = state.sessions.find((session) => session.id === state.activeSessionId)
  return active ? scopeOfSession(active) : state.scope
}

/** A turn still running server-side: its last word is not a receipt. A move is not a word. */
export function isTurnLive(transcript: TranscriptEntry[], session: AgentSession | undefined) {
  const tail = transcript.filter((entry) => entry.update.kind !== 'handoff').at(-1)
  return !!tail && tail.update.kind !== 'turn_done' && session?.status !== 'error'
}
