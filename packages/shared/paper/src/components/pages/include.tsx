import { createContext, useContext } from 'react'
import { styled } from '../../lib'
import type { IncludeProps } from '../../lib/types'
import { usePaperHost } from '../../provider'
import { useIncluded } from './lib'
import { PageLink } from './page-link'

const Inside = createContext(false)

/**
 * Another page, drawn here and kept current: its blocks, not its cover or title. Includes never
 * nest — inside an included page, or pointing at the page itself, it is a link instead.
 */
export function Include({ sheet, render, ...rest }: IncludeProps) {
  const host = usePaperHost()
  const isInside = useContext(Inside)
  const state = useIncluded(sheet)
  if (isInside || sheet === host.pageId) return <PageLink sheet={sheet} />

  return (
    <section
      {...styled(rest, 'wsx-include')}
      aria-label={state.status === 'ready' ? state.title : undefined}
    >
      {state.status === 'ready' && (
        <>
          <button type="button" className="wsx-include-from" onClick={() => host.openSheet(sheet)}>
            From {state.title} ↗
          </button>
          <Inside.Provider value={true}>{render?.(state.root)}</Inside.Provider>
        </>
      )}
      {state.status === 'loading' && <div className="wsx-empty" data-state="loading" aria-busy />}
      {state.status === 'gone' && <p className="wsx-empty">A page you cannot open.</p>}
    </section>
  )
}
