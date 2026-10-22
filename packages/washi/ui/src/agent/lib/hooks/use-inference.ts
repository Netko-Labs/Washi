import { useEffect, useState } from 'react'
import { api } from '../../../api'
import type { InferenceView } from '../types'

/** What the next turn runs on: the key's provider, or the local Claude Code and its model. */
export function useInference(): InferenceView | null {
  const [view, setView] = useState<InferenceView | null>(null)

  useEffect(() => {
    void api.agents.inference
      .query()
      .then((status) =>
        setView({
          active: status.active,
          provider: status.apiKey?.provider ?? null,
          localModel: status.localModel,
          plan: status.localCli?.plan ?? null,
        }),
      )
      .catch(() => setView(null))
  }, [])

  return view
}
