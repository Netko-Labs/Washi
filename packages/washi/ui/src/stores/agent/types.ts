import type {
  AgentSession,
  ApprovalDecision,
  ApprovalMode,
  ApprovalRequest,
  AttachmentRef,
  ChatMove,
  Effort,
  TranscriptEntry,
} from '@washi/domain'

/** Where a chat lives (D110): a page's id, or null for Home. */
export type ChatScope = string | null

/** One state per conversation (D114). */
export type TurnState = 'idle' | 'working' | 'stalled' | 'failed' | 'stopped'

/** The last turn's failure in words; `entryId` is its receipt, null when it never got one. */
export interface TurnFailure {
  entryId: string | null
  text: string
}

/** Flat, so a shallow selector can hold it. */
export interface TurnView {
  state: TurnState
  failureText: string | null
  /** The failed or stopped turn's receipt; the transcript leaves it to the turn status to draw. */
  endId: string | null
  /** The running turn's ask, as the server stamped it (ms). */
  startedAt: number | null
  /** Retry has something to send. */
  canRetry: boolean
}

export interface LastAsk {
  text: string
  attachments: AttachmentRef[]
}

export interface AgentState {
  sessions: AgentSession[]
  activeSessionId: string | null
  transcript: TranscriptEntry[]
  approvals: ApprovalRequest[]
  running: boolean
  /** A working turn nothing has been heard from for `STALL_MS` (D114). */
  stalled: boolean
  /** A blank chat on screen: nothing is created until its first send (D67). */
  draft: boolean
  /** A blank chat in the scope on screen; the first send anchors it there. */
  startDraft: () => void
  /** The place the panel's chats come from, chosen by where the person is (D110). */
  scope: ChatScope
  /** The newest chat that left this page, while the page shows a draft. */
  moved: ChatMove | null
  /** Names the workspace whose per-scope choices are remembered; the host calls it on entry. */
  workspaceKey: string | null
  bind: (workspaceKey: string) => void
  /** The route moved: this scope's chat, the one picked there last, or a draft. */
  followScope: (scope: ChatScope, force?: boolean) => Promise<void>
  /** Re-anchors a chat to a page, or Home; the panel goes with it. */
  moveSession: (id: string, sheetId: ChatScope) => Promise<void>
  /** Opens the place the moved chat is now, with that chat on screen. */
  visitMoved: () => void
  panelOpen: boolean
  togglePanel: () => void
  /** Docked beside the page instead of floating over it (D61). The host remembers it. */
  docked: boolean
  setDocked: (docked: boolean) => void
  toggleDocked: () => void
  init: () => Promise<void>
  initialize: () => Promise<void>
  /** The new conversation's id, even when the person has moved on before it exists. */
  createSession: () => Promise<string | null>
  selectSession: (id: string) => Promise<void>
  renameSession: (id: string, title: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  setSessionOptions: (patch: {
    model?: string | null
    effort?: Effort | null
    approvals?: ApprovalMode | null
  }) => Promise<void>
  sendPrompt: (text: string, attachments?: AttachmentRef[]) => Promise<void>
  stopTurn: () => Promise<void>
  /** Re-sends the last ask; over a stuck turn, Stop first. */
  retryTurn: () => Promise<void>
  /** Re-reads the chat on screen: a receipt missed while the socket was down lands now. */
  refreshActive: () => Promise<void>
  resolveApproval: (id: string, decision: ApprovalDecision) => Promise<void>
  reset: () => void
}
