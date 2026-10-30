import type {
  AgentSession,
  AgentUpdate,
  ApprovalMode,
  AttachmentRef,
  Effort,
  EnabledModel,
  Handoff,
  TranscriptEntry,
} from '@washi/domain'
import type { RefObject } from 'react'
import type { AgentMascotState } from '../../mascot'
import type { TurnState } from '../../stores'

export type TurnDone = Extract<AgentUpdate, { kind: 'turn_done' }>

export interface EmptyChatProps {
  onStarter: (text: string) => void
}

export interface DiffViewProps {
  diff: { path: string; oldText: string; newText: string }
}

export interface ToolPillProps {
  update: AgentUpdate
  followups: AgentUpdate[]
}

export interface TranscriptViewProps {
  transcript: TranscriptEntry[]
}

export type PanelPlacement = 'float' | 'dock' | 'sheet' | 'page'

export interface AgentPanelProps {
  /**
   * Float is the popover; dock is a flex sibling the host places beside the page; sheet fills a
   * phone; page is a chat's own route (D67), where the host owns the frame around it.
   */
  placement?: PanelPlacement
  /** Opens the chat as a page; the host knows where that is. No callback, no ⤢. */
  onExpand?: () => void
}

export interface ConversationsMenuProps {
  onClose: () => void
}

export interface ConversationRowState {
  renamingId: string | null
  confirmingId: string | null
  /** The menu became the page picker for "Move to page…". */
  isPicking: boolean
}

export interface PanelHeaderProps extends AgentPanelProps {
  placement: PanelPlacement
  title: string
  mascotState: AgentMascotState
}

export interface ScopeChipProps {
  /** A page's id, or null for Home. */
  sheetId: string | null
}

export interface MovePickerProps {
  /** Where the chat is now: not offered again. */
  current: string | null
  onPick: (sheetId: string | null) => void
}

export interface HandoffDividerProps {
  handoff: Handoff
}

export interface AutosizeTextareaProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  className: string
  inputRef?: RefObject<HTMLTextAreaElement | null>
}

export interface YoloProps {
  session: AgentSession | null
  inference: InferenceView | null
}

export interface OptionChipsProps {
  session: AgentSession | null
  inference: InferenceView | null
}

export interface InferenceView {
  active: 'local_cli' | 'api_key' | null
  provider: string | null
  /** What a conversation with no pick of its own runs on; null when the key names none. */
  defaultModel: string | null
  localModel: string | null
  plan: string | null
  /** The workspace's picks for the composer; null offers the recommended three. */
  enabledModels: EnabledModel[] | null
  approvalMode: ApprovalMode
  /** Whether a conversation may approve everything for itself (D115). */
  yoloAllowed: boolean
}

export interface ModelChoice {
  id: string
  label: string
  desc: string
}

export interface EffortChoice {
  id: Effort
  label: string
  desc: string
}

export interface AttachMenuProps {
  onPage: (ref: AttachmentRef) => void
  onFile: (file: File) => void
  onClose: () => void
  canUpload: boolean
}

/** The page picker's words and the row lit for Enter. */
export interface PageSearch {
  term: string
  active: number
}

export interface ComposerState {
  draft: string
  attachments: AttachmentRef[]
  uploading: boolean
  error: string | null
}

export interface PanelFrame {
  scrollRef: RefObject<HTMLDivElement | null>
}

/** What moved in the panel's chat: the follow reads it against where the reader is. */
export interface PanelSignal {
  length: number
  turn: TurnState
  sessionId: string | null
  /** The last entry is the person's own ask. */
  isOwnLast: boolean
}

export interface FollowChange {
  isPinned: boolean
  isNewChat: boolean
  isOwnLast: boolean
  length: number
  /** The transcript's length when the follow last looked. */
  shownLength: number
}

export interface ScrollBox {
  scrollHeight: number
  scrollTop: number
  clientHeight: number
}

export interface TurnStatusProps {
  /** The panel's small type, or the chat page's reading column. */
  variant: 'panel' | 'page'
  /** Draws Washi's mark beside "Working…"; off where the turn above already shows it. */
  mark?: boolean
}
