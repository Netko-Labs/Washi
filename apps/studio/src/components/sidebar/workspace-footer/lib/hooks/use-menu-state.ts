import { useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import type { MenuState } from '../types'

/** Open, close, and close on a press outside or Escape — one hook for every footer menu. */
export function useMenuState(): MenuState {
  const [isOpen, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(root, isOpen, () => setOpen(false))
  return {
    isOpen,
    toggle: () => setOpen((current) => !current),
    close: () => setOpen(false),
    root,
  }
}
