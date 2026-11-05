import { useEffect, useState } from 'react'
import { auth, continueUrl } from '@/integrations/auth'
import { api } from '@/integrations/trpc'
import type { ConsentState } from '../types'

const reasonOf = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause))

/**
 * An agent's request to act as this person (D101): who asks, which of their workspaces it may act
 * in (one or several, D124 — what it already had ticked to start), and the answer — the
 * workspaces kept for this agent first, then Better Auth told yes or no.
 */
export function useConsent(clientId: string | null) {
  const [state, setState] = useState<ConsentState>({
    clientName: null,
    workspaces: [],
    chosen: [],
    busy: false,
    error: null,
  })
  const patch = (next: Partial<ConsentState>) => setState((now) => ({ ...now, ...next }))

  useEffect(() => {
    if (!clientId) return patch({ error: 'This link is missing which agent is asking.' })
    Promise.all([
      api.oauth.client.query({ clientId }),
      api.workspaces.list.query(),
      api.oauth.granted.query({ clientId }).catch((): string[] => []),
    ])
      .then(([client, workspaces, granted]) => {
        const had = workspaces.filter((each) => granted.includes(each.id)).map((each) => each.id)
        const first = workspaces[0]?.id
        patch({
          clientName: client.name,
          workspaces,
          chosen: had.length ? had : first ? [first] : [],
        })
      })
      .catch((cause) => patch({ error: reasonOf(cause) }))
  }, [clientId])

  const answer = async (accept: boolean) => {
    if (!clientId) return
    patch({ busy: true, error: null })
    try {
      if (accept) {
        if (state.chosen.length === 0)
          throw new Error('Pick at least one workspace it may work in.')
        await api.oauth.grant.mutate({ clientId, workspaceIds: state.chosen })
      }
      const { data, error } = await auth.$fetch('/oauth2/consent', {
        method: 'POST',
        body: { accept },
      })
      if (error) throw new Error(error.message ?? 'The answer did not go through.')
      const next = continueUrl(data)
      if (!next) throw new Error('The agent gave no address to return to.')
      window.location.assign(next)
    } catch (cause) {
      patch({ busy: false, error: reasonOf(cause) })
    }
  }

  /** Ticks or unticks one, keeping the list's order so the default is the first ticked. */
  const toggle = (id: string) =>
    setState((now) => {
      const ticked = now.chosen.includes(id)
        ? now.chosen.filter((each) => each !== id)
        : [...now.chosen, id]
      const order = now.workspaces.map((each) => each.id)
      return { ...now, chosen: order.filter((each) => ticked.includes(each)) }
    })

  return { state, toggle, answer }
}
