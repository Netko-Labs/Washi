import { useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import type { PeekMenu } from '../types'

/** The peek's ⋯ menu: open, close, and close on a press outside or Escape. */
export function usePeekMenu(): PeekMenu {
  const [isOpen, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(root, isOpen, () => setOpen(false))
  return { isOpen, open: () => setOpen(true), close: () => setOpen(false), root }
}
