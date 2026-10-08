import type {
  AgentSession,
  ApprovalDecision,
  ApprovalRequest,
  TranscriptEntry,
} from '@washi/domain'
import { create } from 'zustand'
import { api } from '@/lib/rpc'
import { useSheetsStore } from '@/stores/sheets/sheets-store'

interface AgentState {
  sessions: AgentSession[]
  activeSessionId: string | null
  transcript: TranscriptEntry[]
  approvals: ApprovalRequest[]
  running: boolean
  panelOpen: boolean
  togglePanel: () => void
  chatExpanded: boolean
  toggleExpanded: () => void
  init: () => Promise<void>
  createSession: () => Promise<void>
  selectSession: (id: string) => Promise<void>
  sendPrompt: (text: string) => Promise<void>
  stopTurn: () => Promise<void>
  resolveApproval: (id: string, decision: ApprovalDecision) => Promise<void>
}

let subscribed = false

/** Header/panel mascot state from the transcript tail (design: agent status lives in chrome). */
export function mascotStateFor(
  transcript: TranscriptEntry[],
  running: boolean,
  approvals: ApprovalRequest[],
): 'idle' | 'reading' | 'thinking' | 'writing' | 'suggesting' | 'done' | 'flagged' {
  if (approvals.length > 0) return 'suggesting'
  const last = transcript.at(-1)?.update
  if (!running) {
    if (last?.kind === 'turn_done') return last.stopReason === 'error' ? 'flagged' : 'done'
    return 'idle'
  }
  for (let index = transcript.length - 1; index >= 0; index--) {
    const update = transcript[index]?.update
    if (update?.kind === 'tool_call') {
      if (update.toolKind === 'read' || update.toolKind === 'search' || update.toolKind === 'fetch')
        return 'reading'
      if (update.toolKind === 'edit') return 'writing'
      return 'thinking'
    }
    if (update?.kind === 'user_message') break
  }
  return 'thinking'
}

export const useAgentStore = create<AgentState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  transcript: [],
  approvals: [],
  running: false,
  panelOpen: false,
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  chatExpanded: false,
  toggleExpanded: () => set((state) => ({ chatExpanded: !state.chatExpanded })),

  init: async () => {
    if (!subscribed) {
      subscribed = true
      api.agents.onAgentUpdate.subscribe(undefined, {
        onData: ({ data: { sessionId, entry } }) => {
          const { activeSessionId } = get()
          if (sessionId !== activeSessionId) return
          set((state) => ({
            transcript: [...state.transcript, entry],
            running: entry.update.kind !== 'turn_done' && state.running,
          }))
          if (entry.update.kind === 'turn_done') {
            void useSheetsStore.getState().refresh()
          }
        },
      })
      api.agents.onApprovalRequested.subscribe(undefined, {
        onData: ({ data: request }) => {
          set((state) =>
            state.approvals.some((approval) => approval.id === request.id)
              ? state
              : { approvals: [...state.approvals, request] },
          )
        },
      })
      api.agents.onOpenSheetRequested.subscribe(undefined, {
        onData: ({ data: { id } }) => {
          void import('@/stores/view/view-store').then(({ useViewStore }) =>
            useViewStore.getState().openTab(`note:${id}`),
          )
          void useSheetsStore.getState().refresh()
        },
      })
    }
    const [sessions, pending] = await Promise.all([
      api.agents.listSessions.query(),
      api.agents.pendingApprovals.query(),
    ])
    set((state) => ({
      sessions,
      approvals: [
        ...state.approvals,
        ...pending.filter((request) => !state.approvals.some((a) => a.id === request.id)),
      ],
    }))
    if (!get().activeSessionId && sessions[0]) await get().selectSession(sessions[0].id)
  },

  createSession: async () => {
    const session = await api.agents.createSession.mutate({
      title: `Session ${get().sessions.length + 1}`,
    })
    set((state) => ({ sessions: [session, ...state.sessions] }))
    await get().selectSession(session.id)
  },

  selectSession: async (id) => {
    const transcript = await api.agents.transcript.query({ sessionId: id })
    set({ activeSessionId: id, transcript })
  },

  sendPrompt: async (text) => {
    let sessionId = get().activeSessionId
    if (!sessionId) {
      await get().createSession()
      sessionId = get().activeSessionId
    }
    if (!sessionId || !text.trim()) return
    set({ running: true })
    await api.agents.prompt.mutate({ sessionId, text })
  },

  stopTurn: async () => {
    const sessionId = get().activeSessionId
    if (sessionId) await api.agents.cancel.mutate({ sessionId })
  },

  resolveApproval: async (id, decision) => {
    await api.agents.resolveApproval.mutate({ id, decision })
    set((state) => ({ approvals: state.approvals.filter((approval) => approval.id !== id) }))
  },
}))
