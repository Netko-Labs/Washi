import type { AgentUpdate, AttachmentRef, Handoff } from '@washi/domain'
import type { useComposer } from '@washi/ui'
import type { RefObject } from 'react'

export type Composer = ReturnType<typeof useComposer>

export type ToolCall = Extract<AgentUpdate, { kind: 'tool_call' }>
export type ToolStatus = ToolCall['status']

export interface ToolStep {
  id: string
  name: string
  input: unknown
  status: ToolStatus
  output: string | null
}

export type PageTouch = 'made' | 'changed'

export interface TouchedPage {
  id: string
  /** What the call named it; the sheets store's title wins once it knows the page. */
  title: string
  touch: PageTouch
}

export type TurnPart =
  | { kind: 'text'; id: string; text: string }
  | { kind: 'tools'; id: string; steps: ToolStep[] }
  | { kind: 'error'; id: string; text: string }
  | { kind: 'stopped'; id: string }
  | { kind: 'handoff'; id: string; handoff: Handoff }

export interface PersonBlock {
  kind: 'person'
  id: string
  text: string
  attachments: AttachmentRef[]
}

export interface WashiBlock {
  kind: 'washi'
  id: string
  parts: TurnPart[]
  pages: TouchedPage[]
}

export type ChatBlock = PersonBlock | WashiBlock

export interface Starter {
  label: string
  prompt: string
  /** False leaves the prompt in the composer for the person to finish. */
  sends: boolean
  attachments?: AttachmentRef[]
}

export interface ScrollBox {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

export interface StickToBottom {
  scrollRef: RefObject<HTMLDivElement | null>
  hasNew: boolean
  onScroll: () => void
  jump: () => void
}

export type BarMode = 'idle' | 'renaming' | 'menu' | 'confirming'

export interface ChatBarProps {
  workspaceId: string
  chatId?: string
}

export interface ChatMissingProps {
  workspaceId: string
}

export interface ChatBodyProps {
  workspaceId: string
  composer: Composer
  isNew: boolean
}

export interface ChatComposerProps {
  composer: Composer
  inputRef?: RefObject<HTMLTextAreaElement | null>
}

export interface ChatDockProps {
  composer: Composer
}

export interface ChatEmptyProps {
  composer: Composer
}

export interface ChatThreadProps {
  workspaceId: string
}

export interface ChatTurnProps {
  block: WashiBlock
  workspaceId: string
  isLive: boolean
  /** The chat's last failure or stop, which the turn status draws instead. */
  endId: string | null
}

export interface ChatPersonProps {
  block: PersonBlock
}

export interface ChatReceiptsProps {
  steps: ToolStep[]
}

export interface ChatPageCardProps {
  page: TouchedPage
  workspaceId: string
}
