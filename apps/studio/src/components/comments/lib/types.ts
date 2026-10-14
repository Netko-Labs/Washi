import type { Comment, CommentWrite, MentionRef } from '@washi/domain'

export interface CommentThread {
  root: Comment
  replies: Comment[]
}

export interface BodySegment {
  text: string
  isMention: boolean
}

export interface CommentsState {
  isOpen: boolean
  sheetId: string | null
  comments: Comment[]
  members: MentionRef[]
  error: string | null
  open: (sheetId: string) => void
  close: () => void
  toggle: (sheetId: string) => void
  load: (sheetId: string) => Promise<void>
  loadMembers: (workspaceId: string) => Promise<void>
  post: (write: CommentWrite) => Promise<boolean>
  resolve: (threadId: string, resolved: boolean) => Promise<void>
  remove: (id: string) => Promise<void>
  reset: () => void
}

export interface CommentsPanelProps {
  sheetId: string
}

export interface CommentThreadProps {
  thread: CommentThread
  myId: string | null
}

export interface CommentItemProps {
  comment: Comment
  isMine: boolean
}

export interface CommentComposerProps {
  sheetId: string
  threadId?: string
  placeholder: string
  onSent?: () => void
}

export interface MentionPickerProps {
  query: string
  onPick: (member: MentionRef) => void
}

export interface CommentsButtonProps {
  sheetId: string
}
