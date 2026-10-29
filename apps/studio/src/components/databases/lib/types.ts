import type { TableCatalogEntry } from '@washi/domain'
import type { RefObject } from 'react'

export interface DatabaseRowProps {
  entry: TableCatalogEntry
  onOpen: () => void
  onTrash: () => Promise<boolean>
}

export interface DatabaseRowMenuProps {
  name: string
  onOpen: () => void
  onTrash: () => Promise<boolean>
}

export interface DatabaseDialogProps {
  name: string
  onClose: () => void
}

export interface RowMenu {
  isOpen: boolean
  isConfirming: boolean
  open: () => void
  confirm: () => void
  close: () => void
  root: RefObject<HTMLDivElement | null>
}
