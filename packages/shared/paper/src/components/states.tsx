import { whenLabel } from '../lib'
import type { BoundProps } from '../lib/types'

/**
 * Empty, loading and error ship with every bound primitive, designed once. A
 * page may override the empty sentence and nothing else.
 */
export function Bound({ state, empty = 'Nothing here yet.', children }: BoundProps) {
  if (state.status === 'loading') {
    return (
      <div className="wsx-empty" data-state="loading" aria-busy>
        Loading…
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="wsx-empty" data-state="error" role="alert">
        This block could not load — {state.error}
      </div>
    )
  }
  if (state.rows.length === 0) {
    return (
      <div className="wsx-empty" data-state="empty">
        {empty}
      </div>
    )
  }
  return children(state.rows)
}

/** A cell in words: a day, a moment or a `start/end` range as dates, a list joined, a tick. */
export function cell(value: unknown, locale?: string): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? '✓' : '—'
  if (Array.isArray(value)) return value.map((each) => cell(each, locale)).join(', ')
  return whenLabel(String(value), locale)
}
