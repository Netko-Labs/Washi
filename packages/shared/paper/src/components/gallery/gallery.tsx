import { type KeyboardEvent, useRef } from 'react'
import { styled } from '../../lib'
import type { GalleryProps } from '../../lib/types'
import { useLightbox } from './lib'

/** Pictures in a grid of squares; a press opens one large, ‹ › or the arrow keys walk the rest. */
export function Gallery({ columns = 3, gap, children, ...rest }: GalleryProps) {
  const grid = useRef<HTMLDivElement>(null)
  const box = useLightbox(grid)

  const keys = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'ArrowRight') box.step(1)
    if (event.key === 'ArrowLeft') box.step(-1)
  }

  return (
    <div {...styled(rest, 'wsx-gallery')} data-columns={columns} data-gap={gap}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: a press anywhere on a picture opens it */}
      <div ref={grid} className="wsx-gallery-grid" onClick={box.open} onKeyDown={box.press}>
        {children}
      </div>
      <dialog ref={box.dialog} className="wsx-lightbox" onClose={box.close} onKeyDown={keys}>
        {box.picture && (
          <figure>
            <img className="wsx-lightbox-image" src={box.picture.src} alt={box.picture.alt} />
            <figcaption>
              {box.picture.caption || box.picture.alt}
              <span>
                {(box.at ?? 0) + 1} / {box.count}
              </span>
            </figcaption>
          </figure>
        )}
        {box.count > 1 && (
          <>
            <button
              type="button"
              className="wsx-lightbox-step"
              data-side="left"
              aria-label="Previous picture"
              onClick={() => box.step(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="wsx-lightbox-step"
              data-side="right"
              aria-label="Next picture"
              onClick={() => box.step(1)}
            >
              ›
            </button>
          </>
        )}
        <button type="button" className="wsx-lightbox-close" aria-label="Close" onClick={box.close}>
          ✕
        </button>
      </dialog>
    </div>
  )
}
