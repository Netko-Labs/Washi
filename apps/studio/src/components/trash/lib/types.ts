import type { TrashEntry } from '@washi/domain'

export interface TrashRowProps {
  entry: TrashEntry
  onRestore: () => void
  onPurge: () => void
}

export interface ConfirmTextButtonProps {
  idle: string
  armed: string
  onConfirm: () => void
}
