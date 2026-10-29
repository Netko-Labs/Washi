import { type ToggleEvent, useEffect, useRef, useState } from 'react'
import {
  PROPERTY_PANEL_GAP as GAP,
  PROPERTY_PANEL_MARGIN as MARGIN,
  PROPERTY_PANEL_WIDTH,
  PROPERTY_PANEL_ROOM as ROOM,
} from '../values'

/**
 * The panel lives in the top layer (Popover API), so the table's sideways scroll never clips it;
 * it is placed under its button by hand and closes when anything outside it scrolls.
 */
export function usePropertyPopover() {
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const close = (event: Event) => {
      if (!panel.current?.contains(event.target as Node)) panel.current?.hidePopover()
    }
    document.addEventListener('scroll', close, { capture: true })
    return () => document.removeEventListener('scroll', close, { capture: true })
  }, [open])

  const show = () => {
    const el = panel.current
    const at = button.current?.getBoundingClientRect()
    if (!el || !at) return
    const { clientWidth, clientHeight } = document.documentElement
    const left = Math.min(
      at.right - PROPERTY_PANEL_WIDTH,
      clientWidth - PROPERTY_PANEL_WIDTH - MARGIN,
    )
    const below = clientHeight - at.bottom - GAP - MARGIN
    const above = at.top - GAP - MARGIN
    const under = below >= ROOM || below >= above
    el.style.left = `${Math.max(MARGIN, left)}px`
    el.style.top = under ? `${at.bottom + GAP}px` : 'auto'
    el.style.bottom = under ? 'auto' : `${clientHeight - at.top + GAP}px`
    el.style.maxHeight = `${under ? below : above}px`
    el.showPopover()
  }

  return {
    button,
    panel,
    open,
    show,
    hide: () => panel.current?.hidePopover(),
    onToggle: (event: ToggleEvent<HTMLDivElement>) => setOpen(event.newState === 'open'),
  }
}
