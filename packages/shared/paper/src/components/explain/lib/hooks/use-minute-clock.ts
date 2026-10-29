import { useEffect, useState } from 'react'
import { MINUTE } from '../constants'

/** The reader's clock, a minute at a time; null until mounted, so a server draw never guesses it. */
export function useMinuteClock(): number | null {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), MINUTE)
    return () => clearInterval(timer)
  }, [])
  return now
}
