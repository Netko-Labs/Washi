import type { ReactNode } from 'react'
import type { BindState } from '../lib/types'

/**
 * Empty, loading and error ship with every bound primitive, designed once. A
 * page may override the empty sentence and nothing else.
 */
export function Bound({
  state,
  empty = 'Nothing here yet.',
  children,
}: {
  state: BindState
  empty?: string
  children: (rows: BindState['rows']) => ReactNode
}) {
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

export function cell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? '✓' : '—'
  return String(value)
}
