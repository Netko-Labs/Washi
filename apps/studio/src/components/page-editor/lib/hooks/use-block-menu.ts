import { useDialogFocus } from '@washi/ui'
import { useCallback, useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import type { BlockMenuState } from '../types'

/** The menu takes focus on open and hands it back to the ⋮⋮ on Escape: it is drawn on the body. */
export function useBlockMenu(): BlockMenuState {
  const [isOpen, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(root, isOpen, close)
  useDialogFocus(menu, isOpen, { returnTo: trigger })

  return { isOpen, toggle: () => setOpen(!isOpen), close, root, trigger, menu }
}
