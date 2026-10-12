import { useCallback, useEffect, useState } from 'react'
import { auth } from '@/lib/auth'
import { api, setActiveWorkspace } from '@/lib/rpc'
import type { WorkspaceSummary } from '@/lib/types'

/** A workspace is an organization, so this is Better Auth's list plus a create. */
export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setWorkspaces(await api.workspaces.list.query())
    } catch (cause) {
      setError(String(cause))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = async (name: string) => {
    setError(null)
    const slug = `${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${Date.now().toString(36)}`
    try {
      const result = await auth.organization.create({ name, slug })
      if (result.error) {
        setError(result.error.message ?? 'Could not create that workspace.')
        return null
      }
      await refresh()
      return result.data?.id ?? null
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      return null
    }
  }

  const open = (id: string) => setActiveWorkspace(id)

  return { workspaces, loading, error, create, open, refresh }
}
