import type { CustomEmojiView } from '@/components/shared/emoji'

export interface EmojiCardProps {
  emoji: CustomEmojiView
  addedBy: string
  isRemovable: boolean
  onRemove: (id: string) => void
}

export interface EmojiAddCardProps {
  add: (name: string, file: File) => Promise<CustomEmojiView>
}
