import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import { INFERENCE_POLL_MS, STATUS_POLL_MS } from '../constants'
import type { AgentActivityWire, AgentStatusView } from '../types'

/** Activity is polled, not streamed: it is a glance, and a stale second costs nothing. */
export function useAgentStatus(): AgentStatusView | null {
  const [status, setStatus] = useState<AgentActivityWire | null>(null)
  const [asleep, setAsleep] = useState(false)

  useEffect(() => {
    let live = true
    const tick = () =>
      void api.agents.status
        .query()
        .then((next) => live && setStatus(next))
        .catch(() => {})
    const wake = () =>
      void api.agents.inference
        .query()
        .then((next) => live && setAsleep(next.active === null))
        .catch(() => {})
    tick()
    wake()
    const statusTimer = setInterval(tick, STATUS_POLL_MS)
    const inferenceTimer = setInterval(wake, INFERENCE_POLL_MS)
    return () => {
      live = false
      clearInterval(statusTimer)
      clearInterval(inferenceTimer)
    }
  }, [])

  if (!status) return null
  return { ...status, state: asleep ? 'asleep' : status.state }
}
