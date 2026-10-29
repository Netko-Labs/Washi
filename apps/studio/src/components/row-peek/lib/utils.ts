import { PEEK_PARAM } from './constants'
import type { PeekAddress } from './types'

export function peekOf(searchStr: string): string | null {
  return new URLSearchParams(searchStr).get(PEEK_PARAM)
}

/** The same address with the peek set or cleared; every other search key is kept as written. */
export function withPeek({ pathname, searchStr }: PeekAddress, sheetId: string | null): string {
  const params = new URLSearchParams(searchStr)
  if (sheetId) params.set(PEEK_PARAM, sheetId)
  else params.delete(PEEK_PARAM)
  const search = params.toString()
  return search ? `${pathname}?${search}` : pathname
}

/** A peek keyboard-closes unless the key belongs to a field or a menu inside it. */
export function isOwnedEscape(event: KeyboardEvent): boolean {
  const { target } = event
  return (
    event.defaultPrevented ||
    (target instanceof Element &&
      target.closest('[data-floating], input, textarea, select, [contenteditable="true"]') !== null)
  )
}
