import { api } from '@washi/ui'
import { useCallback, useEffect, useState } from 'react'
import type { AgentGuideState } from '../types'

/**
 * Whether this page is the workspace's agent guide (D135) — read when the menu opens — and the
 * press that makes it so, or makes it not. A press the server refuses says why and reads the
 * guide again, so the row never shows a state that did not land.
 */
export function useAgentGuide(id: string): AgentGuideState {
  const [guideId, setGuideId] = useState<string | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const read = useCallback(
    (alive: () => boolean = () => true) =>
      api.sheets.agentGuide
        .query()
        .then((guide) => alive() && setGuideId(guide?.id ?? null))
        .catch(() => alive() && setGuideId(null)),
    [],
  )
  useEffect(() => {
    let alive = true
    void read(() => alive)
    return () => {
      alive = false
    }
  }, [read])
  const isGuide = guideId === id
  return {
    isKnown: guideId !== undefined,
    isGuide,
    error,
    toggle: async () => {
      const next = isGuide ? null : id
      try {
        await api.sheets.setAgentGuide.mutate({ id: next })
        setError(null)
        setGuideId(next)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'The guide did not change')
        await read()
      }
    },
  }
}
