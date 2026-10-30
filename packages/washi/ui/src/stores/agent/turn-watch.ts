import type { StoreApi } from 'zustand'
import { STALL_MS } from './constants'
import type { AgentState } from './types'

const tailOf = (state: AgentState) => state.transcript.at(-1)?.id
const asksOf = (state: AgentState) => state.approvals.map((request) => request.id).join()
const isAsking = (state: AgentState) =>
  state.approvals.some((request) => request.sessionId === state.activeSessionId)

/**
 * Marks a working turn `stalled` once nothing is heard for `quietMs` (D114), and re-reads the
 * chat then: a missed receipt ends it. A question waiting on the person is not silence.
 */
export function watchStall(store: StoreApi<AgentState>, quietMs = STALL_MS): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  const clear = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  const arm = () => {
    clear()
    timer = setTimeout(() => {
      timer = null
      const state = store.getState()
      if (!state.running) return
      if (isAsking(state)) return arm()
      store.setState({ stalled: true })
      void state.refreshActive().catch(() => {})
    }, quietMs)
  }
  const unsubscribe = store.subscribe((state, previous) => {
    const isHeard =
      tailOf(state) !== tailOf(previous) ||
      state.activeSessionId !== previous.activeSessionId ||
      state.running !== previous.running ||
      asksOf(state) !== asksOf(previous)
    if (!isHeard) return
    if (state.stalled) store.setState({ stalled: false })
    if (state.running) arm()
    else clear()
  })
  return () => {
    clear()
    unsubscribe()
  }
}

/** Resolves once no turn runs on screen, or after `ms` regardless. */
export function untilIdle(store: StoreApi<AgentState>, ms: number): Promise<void> {
  if (!store.getState().running) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timeout)
      unsubscribe()
      resolve()
    }
    const timeout = setTimeout(done, ms)
    const unsubscribe = store.subscribe((state) => {
      if (!state.running) done()
    })
  })
}
