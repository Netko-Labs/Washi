import type { IssuedAccessToken } from '@washi/domain'
import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { AccessTokens, TokenList } from '../types'

const reasonOf = (cause: unknown, fallback: string) =>
  cause instanceof Error ? cause.message : fallback

/** This person's tokens for this workspace, and the one just made, shown once. */
export function useAccessTokens(): AccessTokens {
  const [listed, setListed] = useState<TokenList>({
    isAvailable: true,
    tokens: [],
  })
  const [issued, setIssued] = useState<IssuedAccessToken | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = () =>
    api.tokens.list
      .query()
      .then(setListed)
      .catch((cause) => setError(reasonOf(cause, 'Could not read your tokens.')))

  useEffect(() => {
    void refresh()
  }, [])

  return {
    ...listed,
    issued,
    error,
    create: async (name) => {
      setError(null)
      try {
        setIssued(await api.tokens.create.mutate({ name }))
        await refresh()
        return true
      } catch (cause) {
        setError(reasonOf(cause, 'The token was not made.'))
        return false
      }
    },
    revoke: async (id) => {
      setError(null)
      try {
        await api.tokens.revoke.mutate({ id })
        if (issued?.info.id === id) setIssued(null)
        await refresh()
      } catch (cause) {
        setError(reasonOf(cause, 'The token was not revoked.'))
      }
    },
    dismiss: () => setIssued(null),
  }
}
