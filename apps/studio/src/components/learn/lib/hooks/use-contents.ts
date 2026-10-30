import { useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import type { ContentsState } from '../types'

/** The folded contents under `md`: open, close, and close on a press outside or Escape. */
export function useContents(): ContentsState {
  const [isOpen, setOpen] = useState(false)
  const root = useRef<HTMLElement>(null)
  useDismiss(root, isOpen, () => setOpen(false))
  return {
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen((current) => !current),
    root,
  }
}
