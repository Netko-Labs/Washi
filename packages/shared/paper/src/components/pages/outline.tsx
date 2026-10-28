import { useRef } from 'react'
import { styled } from '../../lib'
import type { OutlineProps } from '../../lib/types'
import { useOutline } from './lib'

/** The page's own headings as a contents list; a press scrolls to one. */
export function Outline({ title, ...rest }: OutlineProps) {
  const ref = useRef<HTMLElement>(null)
  const entries = useOutline(ref)

  return (
    <nav {...styled(rest, 'wsx-outline')} ref={ref} aria-label={title ?? 'On this page'}>
      {title && <p className="wsx-outline-title">{title}</p>}
      {entries.map((entry, index) => (
        <button
          key={index}
          type="button"
          className="wsx-outline-entry"
          data-level={entry.level}
          onClick={() => entry.target.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          {entry.text}
        </button>
      ))}
      {entries.length === 0 && <p className="wsx-empty">Headings will list here.</p>}
    </nav>
  )
}
