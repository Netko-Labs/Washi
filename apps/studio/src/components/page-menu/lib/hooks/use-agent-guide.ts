import { api } from '@washi/ui'
import { useEffect, useState } from 'react'
import type { AgentGuideState } from '../types'

/**
 * Whether this page is the workspace's agent guide (D135) — read when the menu opens — and the
 * press that makes it so, or makes it not.
 */
export function useAgentGuide(id: string): AgentGuideState {
  const [guideId, setGuideId] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    api.sheets.agentGuide
      .query()
      .then((guide) => alive && setGuideId(guide?.id ?? null))
      .catch(() => alive && setGuideId(null))
    return () => {
      alive = false
    }
  }, [])
  const isGuide = guideId === id
  return {
    isKnown: guideId !== undefined,
    isGuide,
    toggle: async () => {
      const next = isGuide ? null : id
      await api.sheets.setAgentGuide.mutate({ id: next })
      setGuideId(next)
    },
  }
}
