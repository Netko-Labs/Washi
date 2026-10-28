import {
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { LightboxPicture } from '../../../../lib/types'

function picturesIn(grid: HTMLElement | null): LightboxPicture[] {
  return [...(grid?.querySelectorAll<HTMLImageElement>('.wsx-figure img') ?? [])].map((img) => ({
    src: img.currentSrc || img.src,
    alt: img.alt,
    caption: img.closest('.wsx-figure')?.querySelector('figcaption')?.textContent ?? '',
  }))
}

/** Which picture is large, read off the grid as drawn; a press on one opens it in the dialog. */
export function useLightbox(grid: RefObject<HTMLElement | null>) {
  const [at, setAt] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const pictures = at === null ? [] : picturesIn(grid.current)
  const count = pictures.length
  const isOpen = at !== null && count > 0

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (isOpen && !element.open) element.showModal()
    if (!isOpen && element.open) element.close()
  }, [isOpen])

  // Each picture is a button to a keyboard: focusable, named, opened by Enter or Space.
  useEffect(() => {
    const element = grid.current
    if (!element) return
    const mark = () => {
      for (const figure of element.querySelectorAll<HTMLElement>('.wsx-figure')) {
        if (figure.tabIndex === 0) continue
        figure.tabIndex = 0
        figure.setAttribute('role', 'button')
        const alt = figure.querySelector('img')?.alt
        figure.setAttribute('aria-label', alt ? `Open ${alt}` : 'Open the picture')
      }
    }
    mark()
    const watch = new MutationObserver(mark)
    watch.observe(element, { childList: true, subtree: true })
    return () => watch.disconnect()
  }, [grid])

  const openFrom = (target: EventTarget) => {
    const img = (target as HTMLElement).closest('.wsx-figure')?.querySelector('img')
    if (!img) return
    const index = picturesIn(grid.current).findIndex(
      (each) => each.src === (img.currentSrc || img.src),
    )
    if (index >= 0) setAt(index)
  }

  return {
    dialog,
    picture: at === null ? null : (pictures[at] ?? null),
    at,
    count,
    open: (event: MouseEvent<HTMLElement>) => openFrom(event.target),
    press: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      openFrom(event.target)
    },
    step: (by: 1 | -1) =>
      setAt((current) =>
        current === null || count === 0 ? current : (current + by + count) % count,
      ),
    close: () => setAt(null),
  }
}
