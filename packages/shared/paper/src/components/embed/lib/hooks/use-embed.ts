import { useEffect, useState } from 'react'
import type { EmbedState } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import { knownEmbed } from '../../../../registry/embed-providers'

/** A built-in provider plays at once; any other host plays only if the workspace lists it. */
export function useEmbed(src: string): EmbedState {
  const host = usePaperHost()
  const known = knownEmbed(src)
  const [state, setState] = useState<EmbedState>(
    known ? { status: 'playing', player: known.player } : { status: 'asking' },
  )
  useEffect(() => {
    const found = knownEmbed(src)
    if (found) {
      setState({ status: 'playing', player: found.player })
      return
    }
    let alive = true
    const asked = host.embedAllowed?.(new URL(src).hostname) ?? Promise.resolve(false)
    asked
      .then(
        (ok) => alive && setState(ok ? { status: 'playing', player: src } : { status: 'blocked' }),
      )
      .catch(() => alive && setState({ status: 'blocked' }))
    return () => {
      alive = false
    }
  }, [host, src])
  return state
}
