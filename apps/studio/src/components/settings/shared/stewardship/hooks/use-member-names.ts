import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'

/** Member id → name, for "added by"; someone who left reads as nobody in particular. */
export function useMemberNames() {
  const [names, setNames] = useState<ReadonlyMap<string, string>>(new Map())
  useEffect(() => {
    let live = true
    api.workspaces.members
      .query()
      .then((members) => live && setNames(new Map(members.map((m) => [m.id, m.name]))))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return names
}
