import { useDialogFocus } from '@washi/ui'
import { useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import type { ShareMenu } from '../types'

/** Open, close on a press outside or Escape; focus moves into the panel and back to Share. */
export function useShareMenu(): ShareMenu {
  const [isOpen, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  useDismiss(root, isOpen, close)
  useDialogFocus(panel, isOpen, { returnTo: trigger })
  return { isOpen, toggle: () => setOpen((was) => !was), close, root, trigger, panel }
}
