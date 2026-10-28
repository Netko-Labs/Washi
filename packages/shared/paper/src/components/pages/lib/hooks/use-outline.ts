import { type RefObject, useEffect, useState } from 'react'
import type { OutlineEntry } from '../../../../lib/types'

const LEVEL: Record<string, number> = { H1: 1, H2: 2, H3: 3 }

function read(from: HTMLElement): OutlineEntry[] {
  const page = from.closest('[data-sheet-id]') ?? from.closest('.wsx')
  if (!page) return []
  return [...page.querySelectorAll<HTMLElement>('.wsx-title, .wsx-section-title')]
    .filter((heading) => !heading.closest('.wsx-include'))
    .map((heading) => ({
      level: heading.classList.contains('wsx-section-title')
        ? 2
        : Number(heading.dataset.level) || (LEVEL[heading.tagName] ?? 1),
      // While the page is being typed into, a heading is a textarea: its words are its value.
      text:
        (heading instanceof HTMLTextAreaElement ? heading.value : heading.textContent)?.trim() ??
        '',
      target: heading,
    }))
    .filter((entry) => entry.text)
}

const signature = (entries: OutlineEntry[]) =>
  entries.map((entry) => `${entry.level}:${entry.text}`).join('\n')

/** The page's headings as drawn: re-read at most once a frame, set only when they changed. */
export function useOutline(ref: RefObject<HTMLElement | null>): OutlineEntry[] {
  const [entries, setEntries] = useState<OutlineEntry[]>([])
  useEffect(() => {
    const at = ref.current
    const page = at?.closest('[data-sheet-id]') ?? at?.closest('.wsx')
    if (!at || !page) return
    let shown = ''
    let frame = 0
    const refresh = () => {
      frame = 0
      const next = read(at)
      const key = signature(next)
      if (key === shown) return
      shown = key
      setEntries(next)
    }
    refresh()
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(refresh)
    }
    const watch = new MutationObserver(schedule)
    watch.observe(page, { childList: true, subtree: true, characterData: true })
    // Typing changes a field's value, which no mutation reports.
    page.addEventListener('input', schedule)
    return () => {
      watch.disconnect()
      page.removeEventListener('input', schedule)
      cancelAnimationFrame(frame)
    }
  }, [ref])
  return entries
}
