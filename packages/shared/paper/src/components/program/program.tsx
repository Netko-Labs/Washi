import { useMemo } from 'react'
import { INVOKE } from '../../lib/sandbox'
import type { PageProgramProps } from '../../lib/types'
import { type PaperHost, PaperProvider, usePaperHost } from '../../provider'
import { literalOnly, useProgram, withNotice } from './lib'

/**
 * A page that runs (D100): its code in QuickJS, what `view()` draws checked like any page, its
 * presses kept in the browser. Before it has run, or where it cannot, its literal parts draw alone.
 */
export function PageProgram({ root, draw }: PageProgramProps) {
  const host = usePaperHost()
  const { state, invoke } = useProgram(root)
  const scoped = useMemo<PaperHost>(
    () => ({
      ...host,
      runAction: async (action) =>
        action.verb === INVOKE ? invoke(Number(action.handler)) : host.runAction(action),
    }),
    [host, invoke],
  )

  // One provider either way, so what the literal parts drew (a widget's frame) stays mounted.
  if (state.status === 'drawn')
    return <PaperProvider host={scoped}>{draw(state.root)}</PaperProvider>
  const literal = literalOnly(root)
  return (
    <PaperProvider host={scoped}>
      {draw(state.status === 'stopped' ? withNotice(literal, state.reason) : literal)}
    </PaperProvider>
  )
}
