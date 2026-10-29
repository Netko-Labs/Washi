import { useEffect } from 'react'
import type { TitlePart } from '../types'
import { titleOf } from '../utils'

/** Names the browser tab; nothing is restored on unmount — the next screen sets its own. */
export function useDocumentTitle(parts: readonly TitlePart[]): void {
  const title = titleOf(parts)
  useEffect(() => {
    if (title) document.title = title
  }, [title])
}
