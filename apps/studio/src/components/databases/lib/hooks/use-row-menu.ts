import { useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import type { RowMenu } from '../types'

/** A table's ⋯: open, ask once before trashing, close on a press outside or Escape. */
export function useRowMenu(): RowMenu {
  const [isOpen, setOpen] = useState(false)
  const [isConfirming, setConfirming] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const close = () => {
    setOpen(false)
    setConfirming(false)
  }
  useDismiss(root, isOpen, close)
  return {
    isOpen,
    isConfirming,
    open: () => setOpen(true),
    confirm: () => setConfirming(true),
    close,
    root,
  }
}
