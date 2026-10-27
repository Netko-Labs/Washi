import type { ReactNode } from 'react'
import type { CustomEmojiView, EmojiCategoryId, useCustomEmojis } from '@/components/shared/emoji'

export interface EmojiPanelProps {
  current: string | null
  onPick: (value: string) => void
}

export interface EmojiTileProps {
  value: string
  label: string
  isCurrent: boolean
  onPick: (value: string) => void
  children: ReactNode
}

export interface CategoryBarProps {
  active: EmojiCategoryId
  isDimmed: boolean
  onChange: (id: EmojiCategoryId) => void
}

export interface PanelSectionProps {
  title: string
  children: ReactNode
}

export interface CustomGlyphProps {
  fileId: string
  name: string
}

export type CustomEmojiBook = ReturnType<typeof useCustomEmojis>

export interface WorkspaceEmojisProps {
  emojis: CustomEmojiView[]
  add: CustomEmojiBook['add']
  current: string | null
  onPick: (value: string) => void
}

export interface EmojiAddFormProps {
  add: CustomEmojiBook['add']
  onDone: () => void
}
