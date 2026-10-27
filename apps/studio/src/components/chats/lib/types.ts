import type { AgentSession, ChatSearchHit } from '@washi/domain'

export type ChatFilter = 'all' | 'routines' | 'waiting'

export interface ChatGroup {
  label: string
  chats: AgentSession[]
}

export interface SnippetPart {
  text: string
  isHit: boolean
}

export interface ChatRowProps {
  workspaceId: string
  chat: AgentSession
  isRoutine: boolean
  isWaiting: boolean
}

export interface ChatPageProps {
  /** None is a new chat: blank until its first send. */
  chatId?: string
}

export interface ChatsSearchResultsProps {
  workspaceId: string
  hits: ChatSearchHit[]
}

export interface ChatsPageProps {
  workspaceId: string
}
