import type { ReactNode } from 'react'

export interface DialogProps {
  label: string
  onClose: () => void
  children: ReactNode
  width?: number
}
