import { type RefObject, useEffect, useState } from 'react'
import type { OutlineEntry } from '../../../../lib/types'

const LEVEL: Record<string, number> = { H1: 1, H2: 2, H3: 3 }

function read(from: HTMLElement): OutlineEntry[] {
  const page = from.closest('[data-sheet-id]') ?? from.closest('.wsx')
  if (!page) return []
  return [...page.querySelectorAll<HTMLElement>('.wsx-title, .wsx-section-title')]
    .filter((heading) => !heading.closest('.wsx-include'))
    .map((heading) => ({
      level: heading.classList.contains('wsx-section-title') ? 2 : (LEVEL[heading.tagName] ?? 1),
      text: heading.textContent?.trim() ?? '',
      target: heading,
    }))
    .filter((entry) => entry.text)
}

/** The page's headings as drawn, re-read whenever the page around the outline changes. */
export function useOutline(ref: RefObject<HTMLElement | null>): OutlineEntry[] {
  const [entries, setEntries] = useState<OutlineEntry[]>([])
  useEffect(() => {
    const at = ref.current
    const page = at?.closest('[data-sheet-id]') ?? at?.closest('.wsx')
    if (!at || !page) return
    setEntries(read(at))
    const watch = new MutationObserver(() => setEntries(read(at)))
    watch.observe(page, { childList: true, subtree: true, characterData: true })
    return () => watch.disconnect()
  }, [ref])
  return entries
}
