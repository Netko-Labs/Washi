import { useEffect, useState } from 'react'
import { api } from '../../../api'

/** What the composer is actually thinking with — never a model name nobody chose. */
export function useInferenceLabel(): string | null {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    void api.agents.inference
      .query()
      .then((status) => {
        if (status.active === 'local_cli') {
          const parts = ['Claude Code', status.localCli?.plan, status.localModel]
          setLabel(parts.filter((part) => part && part !== 'default').join(' · '))
        } else if (status.active === 'api_key') {
          setLabel('API key')
        } else {
          setLabel('Asleep · see Settings')
        }
      })
      .catch(() => setLabel(null))
  }, [])

  return label
}
