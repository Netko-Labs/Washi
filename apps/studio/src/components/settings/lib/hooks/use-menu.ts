import { useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'

/** Open, close, and close on a press outside or Escape — for every popover on the tab. */
export function useMenu() {
  const [isOpen, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(root, isOpen, () => setOpen(false))
  return { isOpen, open: () => setOpen(true), close: () => setOpen(false), root }
}
