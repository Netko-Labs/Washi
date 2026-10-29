import type {
  AgentSession,
  ApprovalDecision,
  ApprovalRequest,
  AttachmentRef,
  Effort,
  TranscriptEntry,
} from '@washi/domain'

export interface AgentState {
  sessions: AgentSession[]
  activeSessionId: string | null
  transcript: TranscriptEntry[]
  approvals: ApprovalRequest[]
  running: boolean
  /** A blank chat on screen: nothing is created until its first send (D67). */
  draft: boolean
  startDraft: () => void
  panelOpen: boolean
  togglePanel: () => void
  /** Docked beside the page instead of floating over it (D61). The host remembers it. */
  docked: boolean
  setDocked: (docked: boolean) => void
  toggleDocked: () => void
  init: () => Promise<void>
  initialize: () => Promise<void>
  createSession: () => Promise<void>
  selectSession: (id: string) => Promise<void>
  renameSession: (id: string, title: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  setSessionOptions: (patch: { model?: string | null; effort?: Effort | null }) => Promise<void>
  sendPrompt: (text: string, attachments?: AttachmentRef[]) => Promise<void>
  stopTurn: () => Promise<void>
  resolveApproval: (id: string, decision: ApprovalDecision) => Promise<void>
  reset: () => void
}
