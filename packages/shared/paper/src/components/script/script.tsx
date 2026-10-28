import { useMemo } from 'react'
import { styled } from '../../lib'
import type { ScriptProps } from '../../lib/types'
import { type PaperHost, PaperProvider, usePaperHost } from '../../provider'
import { INVOKE, useScript } from './lib'

/**
 * A block a page wrote in TypeScript. It runs in QuickJS with no DOM, network or timers of its
 * own; it reads page state and rows as the reader, acts with the page's verbs, and what it
 * returns is checked as any page is before it is drawn.
 */
export function Script({ title, source, render, ...rest }: ScriptProps) {
  const host = usePaperHost()
  const { state, invoke } = useScript(source)
  const scoped = useMemo<PaperHost>(
    () => ({
      ...host,
      runAction: async (action) =>
        action.verb === INVOKE ? invoke(Number(action.handler)) : host.runAction(action),
    }),
    [host, invoke],
  )

  return (
    <section {...styled(rest, 'wsx-script')} aria-label={title}>
      {title && <p className="wsx-script-title">{title}</p>}
      {state.status === 'drawn' && (
        <PaperProvider host={scoped}>{render?.(state.root)}</PaperProvider>
      )}
      {state.status === 'starting' && <div className="wsx-empty" data-state="loading" aria-busy />}
      {state.status === 'stopped' && (
        <p className="wsx-script-stopped" role="alert">
          Script stopped — {state.reason}
        </p>
      )}
    </section>
  )
}
