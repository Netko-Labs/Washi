import { describe, expect, test } from 'bun:test'
import { STATUS_BUSY_POLL_MS, STATUS_IDLE_POLL_MS } from '../constants'
import type { AgentActivityWire } from '../types'
import { statusPollMs } from '../utils'

const at = (state: AgentActivityWire['state']): AgentActivityWire => ({
  state,
  day: '2026-10-30',
  costUsd: 0,
  savedUsd: 0,
  turns: 0,
  capUsd: 5,
  turnCap: 50,
  paused: state === 'paused',
})

describe('agent status is asked often only while Washi is busy', () => {
  test('a running turn or a waiting question polls quickly', () => {
    expect(statusPollMs(at('working'))).toBe(STATUS_BUSY_POLL_MS)
    expect(statusPollMs(at('needs_you'))).toBe(STATUS_BUSY_POLL_MS)
  })

  test('idle, parked or not yet known is a glance', () => {
    expect(statusPollMs(at('idle'))).toBe(STATUS_IDLE_POLL_MS)
    expect(statusPollMs(at('paused'))).toBe(STATUS_IDLE_POLL_MS)
    expect(statusPollMs(null)).toBe(STATUS_IDLE_POLL_MS)
  })
})
