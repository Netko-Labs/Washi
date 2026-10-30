import { useEffect, useState } from 'react'
import { api } from '../../../api'
import type { InferenceView } from '../types'

/** What the next turn runs on — the key's provider or the local Claude Code — and what it may pick. */
export function useInference(): InferenceView | null {
  const [view, setView] = useState<InferenceView | null>(null)

  useEffect(() => {
    void Promise.all([api.agents.inference.query(), api.agents.settings.query()])
      .then(([status, settings]) =>
        setView({
          active: status.active,
          provider: status.apiKey?.provider ?? null,
          defaultModel: status.apiKey?.model ?? null,
          localModel: status.localModel,
          plan: status.localCli?.plan ?? null,
          enabledModels: settings.enabledModels,
          approvalMode: settings.approvalMode,
          yoloAllowed: settings.yoloAllowed,
        }),
      )
      .catch(() => setView(null))
  }, [])

  return view
}
