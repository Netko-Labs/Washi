import type { KeyboardEvent } from 'react'
import { GRID_COLUMNS } from './values'

const STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -GRID_COLUMNS,
  ArrowDown: GRID_COLUMNS,
}

/** The arrows walk the grid's photos as drawn; Enter and Space press the one in focus. */
export function walkGrid(event: KeyboardEvent<HTMLElement>): void {
  const step = STEPS[event.key]
  if (!step) return
  const tiles = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-photo]')]
  const at = tiles.indexOf(document.activeElement as HTMLButtonElement)
  const next = tiles[Math.min(Math.max(at + step, 0), tiles.length - 1)]
  if (at < 0 || !next) return
  event.preventDefault()
  next.focus()
}

export const messageOf = (cause: unknown) =>
  cause instanceof Error ? cause.message : 'Unsplash did not answer. Try again.'
