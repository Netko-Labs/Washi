import type { ReactNode } from 'react'

export interface BottomSheetProps {
  label: string
  onClose: () => void
  children: ReactNode
}
