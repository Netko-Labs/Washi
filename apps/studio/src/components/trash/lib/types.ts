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

export type TrashItem = { kind: 'page'; entry: TrashEntry } | { kind: 'table'; table: TrashedTable }

export interface TrashedTableRowProps {
  table: TrashedTable
  onRestore: () => void
  onPurge: () => void
}
