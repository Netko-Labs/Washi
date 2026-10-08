import { useEffect, useState } from 'react'
import { api } from '@/lib/rpc'
import { SKIPPED_KEY_PREFIX } from '../constants'

function wasSkipped(workspaceId: string): boolean {
  try {
    return localStorage.getItem(SKIPPED_KEY_PREFIX + workspaceId) === '1'
  } catch {
    return false
  }
}

/**
 * First run is not a route someone visits once; it is what a workspace with
 * nothing to think with looks like. It shows until a key exists or someone
 * says "not now" in this browser.
 */
export function useFirstRun(workspaceId: string) {
  const [asleep, setAsleep] = useState<boolean | null>(null)
  const [skipped, setSkipped] = useState(() => wasSkipped(workspaceId))

  useEffect(() => {
    let live = true
    setAsleep(null)
    setSkipped(wasSkipped(workspaceId))
    api.agents.inference
      .query()
      .then((status) => live && setAsleep(status.active === null))
      .catch(() => live && setAsleep(false))
    return () => {
      live = false
    }
  }, [workspaceId])

  const skip = () => {
    try {
      localStorage.setItem(SKIPPED_KEY_PREFIX + workspaceId, '1')
    } catch {
      // private mode; it will simply ask again next visit
    }
    setSkipped(true)
  }

  return { show: asleep === true && !skipped, skip, done: () => setAsleep(false) }
}
