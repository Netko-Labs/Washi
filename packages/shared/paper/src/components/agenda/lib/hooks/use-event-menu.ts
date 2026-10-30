import { useEffect, useRef, useState } from 'react'
import type { EventMenuPage } from '../types'

/**
 * The browser's own modal, open from the moment it mounts: focus stays in it, Escape closes it.
 * Every way out goes through `close()`, so the browser hands focus back to the event's ⋯.
 */
export function useEventMenu() {
  const dialog = useRef<HTMLDialogElement>(null)
  const [page, setPage] = useState<EventMenuPage>('menu')

  useEffect(() => {
    const el = dialog.current
    if (!el || el.open) return
    el.showModal()
    el.querySelector<HTMLElement>('.wsx-agenda-menu-item')?.focus()
  }, [])

  return { dialog, page, setPage, close: () => dialog.current?.close() }
}
