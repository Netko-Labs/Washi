import type { SheetLookHost } from '@washi/paper'
import { fileUrl } from '@/integrations/trpc'
import type { AnchoredAt } from './types'
import { useLookPickerStore } from './use-look-picker-store'

export function pictureUrl(slug: string): string {
  return `/covers/${slug}.jpg`
}

/** What the studio lends a page's look: its pictures, its uploads, and a picker on whatever was clicked. */
export function pageLook(workspaceId: string): Omit<SheetLookHost, 'band' | 'drawIcon'> {
  return {
    pictureUrl,
    fileUrl: (id) => fileUrl(id, workspaceId),
    edit: (part, anchor) => useLookPickerStore.getState().show(part, anchor),
  }
}

const PICKER_WIDTH = 300
const GUTTER = 8

/** Under the anchor, hanging toward the side of the screen it sits on, and kept on screen. */
export function anchoredAt(anchor: HTMLElement): AnchoredAt {
  const rect = anchor.getBoundingClientRect()
  const width = document.documentElement.clientWidth
  const top = rect.bottom + 4
  if (rect.left + rect.width / 2 > width / 2) {
    return { top, right: Math.max(GUTTER, width - rect.right) }
  }
  return { top, left: Math.max(GUTTER, Math.min(rect.left, width - PICKER_WIDTH - GUTTER)) }
}
