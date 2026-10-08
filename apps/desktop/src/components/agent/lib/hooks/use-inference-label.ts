import { useEffect, useState } from 'react'
import { api } from '@/lib/rpc'

/** What the composer is actually thinking with — never a model name nobody chose. */
export function useInferenceLabel(): string | null {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    void api.agents.inference
      .query()
      .then((status) => {
        if (status.active === 'local_cli') {
          const plan = status.localCli?.plan
          setLabel(plan ? `Claude Code · ${plan}` : 'Claude Code')
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
