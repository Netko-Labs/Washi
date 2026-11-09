import { useEffect, useRef, useState } from 'react'
import type { EventAnchor, EventMenuPage } from '../types'
import { cardPlacement } from '../utils'

/**
 * The browser's own modal, open from the moment it mounts: focus stays in it, Escape closes it.
 * Every way out goes through `close()`, so the browser hands focus back to the event pressed.
 */
export function useEventMenu(anchor?: EventAnchor) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [page, setPage] = useState<EventMenuPage>('card')

  useEffect(() => {
    const el = dialog.current
    if (!el || el.open) return
    el.showModal()
    // On a wide screen the card opens beside the event pressed, as a popover; a phone keeps the sheet.
    const at = anchor
      ? cardPlacement(anchor, el.offsetHeight, { width: innerWidth, height: innerHeight })
      : null
    if (at) {
      el.dataset.beside = ''
      el.style.top = `${at.top}px`
      el.style.left = `${at.left}px`
    }
    el.querySelector<HTMLElement>('.wsx-dialog-close')?.focus()
  }, [anchor])

  return { dialog, page, setPage, close: () => dialog.current?.close() }
}
