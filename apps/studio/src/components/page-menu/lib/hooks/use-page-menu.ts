import { focusablesIn, useDialogFocus, useMenuKeys } from '@washi/ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import type { PageMenuMode, PageMenuState } from '../types'

/**
 * Wide, the popover holds focus: the menu's first item on open, a panel's first stop when it
 * swaps in, the trigger again on Escape, Tab or a pick. Focus moving out closes it.
 */
export function usePageMenu(compact = false): PageMenuState {
  const [mode, setMode] = useState<PageMenuMode | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setMode(null), [])
  const isPopover = mode !== null && !compact
  useDismiss(root, mode !== null, close)
  useDialogFocus(popover, isPopover, { returnTo: trigger })
  useMenuKeys(root, isPopover, close)

  useEffect(() => {
    const box = popover.current
    if (!mode || !box || box.contains(document.activeElement)) return
    focusablesIn(box)[0]?.focus()
  }, [mode])

  useEffect(() => {
    const frame = root.current
    if (!isPopover || !frame) return
    const leave = (event: FocusEvent) => {
      const next = event.relatedTarget
      if (!(next instanceof Element) || frame.contains(next) || next.closest('[data-floating]')) {
        return
      }
      close()
    }
    frame.addEventListener('focusout', leave)
    return () => frame.removeEventListener('focusout', leave)
  }, [isPopover, close])

  return {
    mode,
    setMode,
    toggle: () => setMode(mode ? null : 'menu'),
    close,
    root,
    trigger,
    popover,
  }
}
