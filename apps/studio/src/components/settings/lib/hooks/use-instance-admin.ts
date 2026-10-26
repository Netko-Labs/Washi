import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'

/** Whether this person runs the server — only they see the Server tab. */
export function useInstanceAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    let live = true
    api.instance.me
      .query()
      .then((me) => live && setIsAdmin(me.isAdmin))
      .catch(() => live && setIsAdmin(false))
    return () => {
      live = false
    }
  }, [])
  return isAdmin
}
