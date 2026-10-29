import { useEffect, useState } from 'react'
import { auth, continueUrl } from '@/integrations/auth'
import { api } from '@/integrations/trpc'
import type { ConsentState } from '../types'

const reasonOf = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause))

/**
 * An agent's request to act as this person (D101): who asks, which of their workspaces it may act
 * in, and the answer — the workspace kept for this agent first, then Better Auth told yes or no.
 */
export function useConsent(clientId: string | null) {
  const [state, setState] = useState<ConsentState>({
    clientName: null,
    workspaces: [],
    chosen: null,
    busy: false,
    error: null,
  })
  const patch = (next: Partial<ConsentState>) => setState((now) => ({ ...now, ...next }))

  useEffect(() => {
    if (!clientId) return patch({ error: 'This link is missing which agent is asking.' })
    Promise.all([api.oauth.client.query({ clientId }), api.workspaces.list.query()])
      .then(([client, workspaces]) =>
        patch({ clientName: client.name, workspaces, chosen: workspaces[0]?.id ?? null }),
      )
      .catch((cause) => patch({ error: reasonOf(cause) }))
  }, [clientId])

  const answer = async (accept: boolean) => {
    if (!clientId) return
    patch({ busy: true, error: null })
    try {
      if (accept) {
        if (!state.chosen) throw new Error('Pick the workspace it may work in.')
        await api.oauth.grant.mutate({ clientId, workspaceId: state.chosen })
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

  return { state, choose: (chosen: string) => patch({ chosen }), answer }
}
