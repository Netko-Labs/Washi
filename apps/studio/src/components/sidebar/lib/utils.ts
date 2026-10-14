import type { MouseEvent } from 'react'

/**
 * Sidebar entries are real links: a modified or middle click opens a browser tab like any link;
 * a plain click opens a Washi tab in place.
 */
export function openInPlace(event: MouseEvent, open: () => void): void {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
  event.preventDefault()
  open()
}
