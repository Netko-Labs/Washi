import type { TrashEntry, TrashedTable } from '@washi/domain'

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

export interface TrashedTableRowProps {
  table: TrashedTable
  onRestore: () => void
  onPurge: () => void
}
