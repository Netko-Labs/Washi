import type { PageDrop } from '@washi/ui'
import type { DragEvent } from 'react'
import { EDGE_RATIO } from './constants'

export function dropZone(event: DragEvent<HTMLElement>): PageDrop {
  const rect = event.currentTarget.getBoundingClientRect()
  const ratio = (event.clientY - rect.top) / rect.height
  if (ratio < EDGE_RATIO) return 'before'
  if (ratio > 1 - EDGE_RATIO) return 'after'
  return 'inside'
}
