import type { SheetLookHost } from '@washi/paper'

export type PeekMode = 'side' | 'center'

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
}
