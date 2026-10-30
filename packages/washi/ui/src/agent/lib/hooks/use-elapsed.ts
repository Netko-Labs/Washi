import { useEffect, useState } from 'react'
import { elapsedLabel } from '../utils'

/** `m:ss` since `since`, ticking each second; null while there is nothing to time. */
export function useElapsed(since: number | null): string | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (since === null) return
    setNow(Date.now())
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [since])
  return since === null ? null : elapsedLabel(now - since)
}
