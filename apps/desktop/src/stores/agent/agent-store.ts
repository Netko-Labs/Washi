import type {
  AgentSession,
  ApprovalDecision,
  ApprovalRequest,
  TranscriptEntry,
} from '@washi/desktop-domain'
import { create } from 'zustand'
import { api } from '@/lib/rpc'
import { useSheetsStore } from '@/stores/sheets/sheets-store'

interface AgentState {
  sessions: AgentSession[]
  activeSessionId: string | null
  transcript: TranscriptEntry[]
  approvals: ApprovalRequest[]
  running: boolean
  init: () => Promise<void>
  createSession: () => Promise<void>
  selectSession: (id: string) => Promise<void>
  sendPrompt: (text: string) => Promise<void>
  resolveApproval: (id: string, decision: ApprovalDecision) => Promise<void>
}

let subscribed = false

export const useAgentStore = create<AgentState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  transcript: [],
  approvals: [],
  running: false,

  init: async () => {
    if (!subscribed) {
      subscribed = true
      api.agentUpdate.on(({ sessionId, entry }) => {
        const { activeSessionId } = get()
        if (sessionId !== activeSessionId) return
        set((state) => ({
          transcript: [...state.transcript, entry],
          running: entry.update.kind !== 'turn_done' && state.running,
        }))
        if (entry.update.kind === 'turn_done') {
          void useSheetsStore.getState().refresh()
        }
      })
      api.approvalRequested.on((request) => {
        set((state) => ({ approvals: [...state.approvals, request] }))
      })
      api.openSheetRequested.on(({ id }) => {
        useSheetsStore.getState().select(id)
        void useSheetsStore.getState().refresh()
      })
    }
    const sessions = await api.listSessions({})
    set({ sessions })
    if (!get().activeSessionId && sessions[0]) await get().selectSession(sessions[0].id)
  },

  createSession: async () => {
    const session = await api.createSession({ title: `Session ${get().sessions.length + 1}` })
    set((state) => ({ sessions: [session, ...state.sessions] }))
    await get().selectSession(session.id)
  },

  selectSession: async (id) => {
    const transcript = await api.getTranscript({ sessionId: id })
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
    await api.promptAgent({ sessionId, text })
  },

  resolveApproval: async (id, decision) => {
    await api.resolveApproval({ id, decision })
    set((state) => ({ approvals: state.approvals.filter((approval) => approval.id !== id) }))
  },
}))
