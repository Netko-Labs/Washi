import { forgetEmbedHosts } from '@washi/ui'
import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'

/** The sites this workspace's pages may embed past the built-in ones, and whether widgets run. */
export function useEmbedHosts() {
  const [hosts, setHosts] = useState<string[]>([])
  const [widgets, setWidgets] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    api.embeds.hosts
      .query()
      .then((listed) => alive && setHosts(listed))
      .catch(() => alive && setError('Could not read this workspace’s embed list.'))
    api.embeds.widgets
      .query()
      .then((on) => alive && setWidgets(on))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  /** Answers whether it landed; a refusal says why in `error`. */
  const save = async (next: string[]): Promise<boolean> => {
    setError(null)
    try {
      setHosts(await api.embeds.setHosts.mutate({ hosts: next }))
      forgetEmbedHosts()
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the list.')
      return false
    }
  }

  /** Widgets run a page's own code: an owner's switch, refused for anyone else. */
  const allowWidgets = async (on: boolean) => {
    setError(null)
    try {
      setWidgets(await api.embeds.setWidgets.mutate({ enabled: on }))
      forgetEmbedHosts()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not change widgets.')
    }
  }

  return { hosts, widgets, error, save, allowWidgets }
}
