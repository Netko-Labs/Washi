import type { SheetLookHost } from '@washi/paper'
import type { ComponentType, RefObject } from 'react'

export type PeekMode = 'side' | 'center'

export interface PeekModeOption {
  mode: PeekMode
  label: string
  icon: ComponentType<{ className?: string }>
}

export type PeekLook = Omit<SheetLookHost, 'band' | 'drawIcon'>

export interface Peek {
  sheetId: string | null
  close: () => void
  expand: () => void
}

export interface PeekAddress {
  pathname: string
  searchStr: string
}

export interface RowPeekProps {
  workspaceId: string
}

export interface RowPeekBarProps {
  mode: PeekMode
  onMode: (mode: PeekMode) => void
  onClose: () => void
  onExpand: () => void
  /** The row's page and the workspace it lives in — for its link and its delete. */
  sheetId: string
  workspaceId: string
}

export interface RowPeekMenuProps {
  sheetId: string
  workspaceId: string
  onDeleted: () => void
}

export interface PeekMenu {
  isOpen: boolean
  open: () => void
  close: () => void
  root: RefObject<HTMLDivElement | null>
}
