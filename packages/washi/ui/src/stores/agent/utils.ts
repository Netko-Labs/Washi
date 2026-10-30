import type { AgentSession, ApprovalRequest, TranscriptEntry } from '@washi/domain'
import type { TabKey } from '../view/types'
import type { AgentState, ChatScope, LastAsk, TurnFailure, TurnView } from './types'
import { TURN_CUT_OFF, TURN_FAILED } from './values'

/** Header/panel mascot state from the transcript tail (design: agent status lives in chrome). */
export function mascotStateFor(
  transcript: TranscriptEntry[],
  running: boolean,
  approvals: ApprovalRequest[],
  stalled = false,
): 'idle' | 'reading' | 'thinking' | 'writing' | 'suggesting' | 'done' | 'flagged' {
  if (approvals.length > 0) return 'suggesting'
  if (running && stalled) return 'flagged'
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

const lastWord = (transcript: TranscriptEntry[]) =>
  transcript.filter((entry) => entry.update.kind !== 'handoff').at(-1)

/** A turn still running server-side: its last word is not a receipt. A move is not a word. */
export function isTurnLive(transcript: TranscriptEntry[], session: AgentSession | undefined) {
  const tail = lastWord(transcript)
  return !!tail && tail.update.kind !== 'turn_done' && session?.status !== 'error'
}

/** The last turn failed: its receipt says so, or the chat errored before one was written. */
export function failureOf(
  transcript: TranscriptEntry[],
  session: AgentSession | undefined,
): TurnFailure | null {
  const tail = lastWord(transcript)
  if (!tail) return null
  if (tail.update.kind === 'turn_done') {
    return tail.update.stopReason === 'error'
      ? { entryId: tail.id, text: tail.update.error ?? TURN_FAILED }
      : null
  }
  return session?.status === 'error' ? { entryId: null, text: TURN_CUT_OFF } : null
}

const askEntry = (transcript: TranscriptEntry[]) =>
  [...transcript].reverse().find((entry) => entry.update.kind === 'user_message')

export function lastAsk(transcript: TranscriptEntry[]): LastAsk | null {
  const ask = askEntry(transcript)?.update
  if (ask?.kind !== 'user_message') return null
  return { text: ask.text, attachments: ask.attachments ?? [] }
}

/** An HLC stamp's wall clock: its first fourteen digits are milliseconds. */
const msOf = (stamp: string) => Number(stamp.slice(0, 14)) || null

/** The chat on screen as one state (D114), from what the store already holds. */
export function turnViewOf(
  state: Pick<AgentState, 'transcript' | 'running' | 'stalled' | 'sessions' | 'activeSessionId'>,
): TurnView {
  const { transcript, running, stalled } = state
  const session = state.sessions.find((each) => each.id === state.activeSessionId)
  const ask = askEntry(transcript)
  const failure = running ? null : failureOf(transcript, session)
  return {
    state: running ? (stalled ? 'stalled' : 'working') : failure ? 'failed' : 'idle',
    failureText: failure?.text ?? null,
    failureId: failure?.entryId ?? null,
    startedAt: running && ask ? msOf(ask.createdAt) : null,
    canRetry: !!ask,
  }
}
