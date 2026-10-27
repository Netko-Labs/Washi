import type { AgentSession, AttachmentRef, Effort, EnabledModel } from '@washi/domain'
import type { RefObject } from 'react'

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
}

export interface OptionChipsProps {
  session: AgentSession | null
  inference: InferenceView | null
}

export interface InferenceView {
  active: 'local_cli' | 'api_key' | null
  provider: string | null
  localModel: string | null
  plan: string | null
  /** The workspace's picks for the composer; null offers the recommended three. */
  enabledModels: EnabledModel[] | null
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

export interface ComposerState {
  draft: string
  attachments: AttachmentRef[]
  uploading: boolean
  error: string | null
}

export interface PanelFrame {
  scrollRef: RefObject<HTMLDivElement | null>
  activeSheetTitle: string | null
}
