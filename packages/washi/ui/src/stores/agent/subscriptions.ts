import type { StoreApi } from 'zustand'
import { api } from '../../api'
import { useSheetsStore } from '../sheets/sheets-store'
import { useViewStore } from '../view/view-store'
import { rememberChat } from './chat-memory'
import type { AgentState, ChatScope } from './types'
import { scopeOfTab } from './utils'

type Store = Pick<StoreApi<AgentState>, 'getState' | 'setState'>

/** Set while Washi's own navigation runs, so the route change does not swap the chat. */
let carrying = false

/** The chat on screen now lives at `scope`: the list, the chip and the memory agree. */
function settleActive({ getState, setState }: Store, id: string, scope: ChatScope) {
  setState((state) => ({
    scope,
    sessions: state.sessions.map((session) =>
      session.id === id
        ? { ...session, anchor: scope ? { sheetId: scope, scope: 'page' } : null }
        : session,
    ),
  }))
  rememberChat(getState().workspaceKey, scope, id)
}

/** Every live feed the agent store hears, and the route it follows (D110). */
export function subscribeAgent(store: Store): { unsubscribe: () => void }[] {
  const { getState: get, setState: set } = store
  const agentUpdates = api.agents.onAgentUpdate.subscribe(undefined, {
    onData: ({ data: { sessionId, entry } }) => {
      if (sessionId !== get().activeSessionId) return
      set((state) => ({
        transcript: [...state.transcript, entry],
        running: entry.update.kind !== 'turn_done' && state.running,
      }))
      if (entry.update.kind === 'handoff') settleActive(store, sessionId, entry.update.to)
      if (entry.update.kind === 'turn_done') void useSheetsStore.getState().refresh()
    },
  })
  const approvalRequests = api.agents.onApprovalRequested.subscribe(undefined, {
    onData: ({ data: request }) => {
      set((state) =>
        state.approvals.some((approval) => approval.id === request.id)
          ? state
          : { approvals: [...state.approvals, request] },
      )
    },
  })
  const openSheetRequests = api.agents.onOpenSheetRequested.subscribe(undefined, {
    onData: ({ data: { id, sessionId } }) => {
      const { activeSessionId, running, panelOpen } = get()
      if (sessionId && sessionId !== activeSessionId) return
      if (sessionId) settleActive(store, sessionId, id)
      // A handover seen on the chat's own page goes on in the panel, beside the page it moved to.
      if (sessionId && !panelOpen) set({ panelOpen: true })
      // Washi's page mid-turn opens with its chat still on screen.
      carrying = !sessionId && running
      useViewStore.getState().openTab(`note:${id}`)
      carrying = false
      void useSheetsStore.getState().refresh()
    },
  })
  const sessionChanges = api.agents.onSessionChanged.subscribe(undefined, {
    onData: () => {
      void api.agents.listSessions.query().then((sessions) => set({ sessions }))
    },
  })
  const route = useViewStore.subscribe((state, previous) => {
    if (state.activeTab === previous.activeTab || carrying) return
    const scope = scopeOfTab(state.activeTab)
    if (scope !== undefined) void get().followScope(scope)
  })
  return [agentUpdates, approvalRequests, openSheetRequests, sessionChanges, { unsubscribe: route }]
}
