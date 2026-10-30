import { useEffect, useState } from 'react'
import { isStaleChunkError, reloadForNewBuild } from '../utils'

/** An error from a gone chunk reloads once; true while that reload is on its way. */
export function useStaleRecovery(error: unknown): boolean {
  const isStale = isStaleChunkError(error)
  const [isReloading, setReloading] = useState(isStale)

  useEffect(() => {
    if (isStale) setReloading(reloadForNewBuild())
  }, [isStale])

  return isReloading
}
