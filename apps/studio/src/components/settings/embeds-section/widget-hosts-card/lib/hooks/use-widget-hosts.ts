import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'

/** The sites this workspace's widgets may reach, past the server's (D118). */
export function useWidgetHosts() {
  const [hosts, setHosts] = useState<string[]>([])

  useEffect(() => {
    let alive = true
    api.embeds.widgetHosts
      .query()
      .then((listed) => alive && setHosts(listed))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  /** Null when it took; otherwise the refusal, in words. */
  const save = async (next: string[]): Promise<string | null> => {
    try {
      setHosts(await api.embeds.setWidgetHosts.mutate({ hosts: next }))
      return null
    } catch (cause) {
      return cause instanceof Error ? cause.message : 'Could not save the list.'
    }
  }

  return { hosts, save }
}
