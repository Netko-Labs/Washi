import { type MouseEvent, type RefObject, useState } from 'react'
import type { LightboxPicture } from '../../../../lib/types'

function picturesIn(grid: HTMLElement | null): LightboxPicture[] {
  return [...(grid?.querySelectorAll<HTMLImageElement>('.wsx-figure img') ?? [])].map((img) => ({
    src: img.currentSrc || img.src,
    alt: img.alt,
    caption: img.closest('.wsx-figure')?.querySelector('figcaption')?.textContent ?? '',
  }))
}

/** Which picture is large, read off the grid as drawn; a press on one opens it. */
export function useLightbox(grid: RefObject<HTMLElement | null>) {
  const [at, setAt] = useState<number | null>(null)
  const pictures = at === null ? [] : picturesIn(grid.current)
  const count = pictures.length

  return {
    picture: at === null ? null : (pictures[at] ?? null),
    at,
    count,
    open: (event: MouseEvent<HTMLElement>) => {
      const img = (event.target as HTMLElement).closest('.wsx-figure')?.querySelector('img')
      if (!img) return
      const index = picturesIn(grid.current).findIndex(
        (each) => each.src === (img.currentSrc || img.src),
      )
      if (index >= 0) setAt(index)
    },
    step: (by: 1 | -1) =>
      setAt((current) =>
        current === null || count === 0 ? current : (current + by + count) % count,
      ),
    close: () => setAt(null),
  }
}
