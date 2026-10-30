import { type RefObject, useEffect } from 'react'
import type { DialogFocusOptions } from '../types'
import { focusablesIn, wrapIndex } from '../utils'

/**
 * While open, focus is inside `ref` (its first stop, else the box itself — give it
 * `tabIndex={-1}`); on close it goes back, unless the person already put it somewhere else.
 */
export function useDialogFocus(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  { trap = false, returnTo }: DialogFocusOptions = {},
) {
  useEffect(() => {
    const root = ref.current
    if (!isOpen || !root) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!root.contains(document.activeElement)) (focusablesIn(root)[0] ?? root).focus()

    const keepInside = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const stops = focusablesIn(root)
      const active = document.activeElement
      const index = active instanceof HTMLElement ? stops.indexOf(active) : -1
      const target = wrapIndex(stops.length, index, event.shiftKey)
      if (stops.length > 0 && target === null) return
      event.preventDefault()
      ;(target === null ? root : stops[target])?.focus()
    }
    if (trap) document.addEventListener('keydown', keepInside)

    return () => {
      document.removeEventListener('keydown', keepInside)
      const now = document.activeElement
      if (now && now !== document.body && !root.contains(now)) return
      ;(returnTo?.current ?? opener)?.focus()
    }
  }, [ref, isOpen, trap, returnTo])
}
