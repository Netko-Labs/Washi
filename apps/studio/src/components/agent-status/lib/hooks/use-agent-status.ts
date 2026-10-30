import { useAgentStore } from '@washi/ui'
import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import { INFERENCE_POLL_MS, STATUS_IDLE_POLL_MS } from '../constants'
import type { AgentActivityWire, AgentStatusView } from '../types'
import { statusPollMs } from '../utils'

/**
 * Activity is polled, not streamed: it is a glance, and covers turns this reader cannot see
 * (a teammate's, a routine's). Quick only while one runs; this reader's own turn re-reads it.
 */
export function useAgentStatus(): AgentStatusView | null {
  const [status, setStatus] = useState<AgentActivityWire | null>(null)
  const [asleep, setAsleep] = useState(false)

  useEffect(() => {
    let live = true
    let asked = 0
    let statusTimer: ReturnType<typeof setTimeout> | undefined
    const tick = () => {
      const mine = ++asked
      clearTimeout(statusTimer)
      void api.agents.status
        .query()
        .then((next) => {
          if (!live || mine !== asked) return
          setStatus(next)
          statusTimer = setTimeout(tick, statusPollMs(next))
        })
        .catch(() => {
          if (live && mine === asked) statusTimer = setTimeout(tick, STATUS_IDLE_POLL_MS)
        })
    }
    const wake = () =>
      void api.agents.inference
        .query()
        .then((next) => live && setAsleep(next.active === null))
        .catch(() => {})
    tick()
    wake()
    const stopWatching = useAgentStore.subscribe((state, previous) => {
      const isMoved =
        state.running !== previous.running || state.approvals.length !== previous.approvals.length
      if (isMoved) tick()
    })
    const inferenceTimer = setInterval(wake, INFERENCE_POLL_MS)
    return () => {
      live = false
      stopWatching()
      clearTimeout(statusTimer)
      clearInterval(inferenceTimer)
    }
  }, [])

  if (!status) return null
  return { ...status, state: asleep ? 'asleep' : status.state }
}
