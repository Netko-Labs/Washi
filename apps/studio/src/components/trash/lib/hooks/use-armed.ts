import { useEffect, useState } from 'react'
import { CONFIRM_WINDOW_MS } from '../constants'

/** A second click within the window confirms; otherwise the button quietly disarms. */
export function useArmed() {
  const [isArmed, setArmed] = useState(false)

  useEffect(() => {
    if (!isArmed) return
    const timer = setTimeout(() => setArmed(false), CONFIRM_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [isArmed])

  return { isArmed, arm: () => setArmed(true), disarm: () => setArmed(false) }
}
