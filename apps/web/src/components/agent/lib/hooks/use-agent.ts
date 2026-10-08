import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/rpc'
import type { ApprovalDecision, ApprovalView, TranscriptEntryView } from '../types'

/**
 * One conversation, streamed. The subscription resumes from `lastEventId`, so a
 * closed laptop rejoins mid-turn instead of losing the middle of it.
 */
export function useAgent(
  workspaceId: string,
  onSheetsChanged: () => void,
  onOpenSheet: (id: string) => void,
) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntryView[]>([])
  const [approvals, setApprovals] = useState<ApprovalView[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const active = useRef<string | null>(null)
  // Callbacks ride refs so the subscriptions live as long as the panel: a fresh
  // arrow from the shell must not tear down and reopen three SSE streams.
  const callbacks = useRef({ onSheetsChanged, onOpenSheet })
  callbacks.current = { onSheetsChanged, onOpenSheet }

  useEffect(() => {
    active.current = sessionId
  }, [sessionId])

  const start = useCallback(async () => {
    const sessions = await api.agents.listSessions.query()
    const session = sessions[0] ?? (await api.agents.createSession.mutate({ title: 'Session 1' }))
    setSessionId(session.id)
    setTranscript(
      (await api.agents.transcript.query({ sessionId: session.id })) as TranscriptEntryView[],
    )
    // A panel opened mid-turn still owes an answer to whatever Washi is waiting on.
    const pending = (await api.agents.pendingApprovals.query()) as ApprovalView[]
    setApprovals((prev) => [...prev, ...pending.filter((p) => !prev.some((a) => a.id === p.id))])
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: workspaceId switches the header
  useEffect(() => {
    setSessionId(null)
    setTranscript([])
    setApprovals([])
    void start().catch((cause) => setError(String(cause)))
  }, [workspaceId, start])

  useEffect(() => {
    const updates = api.agents.onAgentUpdate.subscribe(undefined, {
      onData: ({ data }) => {
        if (data.sessionId !== active.current) return
        setTranscript((prev) => [...prev, data.entry as TranscriptEntryView])
        if (data.entry.update.kind === 'turn_done') {
          setRunning(false)
          callbacks.current.onSheetsChanged()
        }
      },
      onError: (cause) => setError(String(cause)),
    })
    const requests = api.agents.onApprovalRequested.subscribe(undefined, {
      onData: ({ data }) =>
        setApprovals((prev) =>
          prev.some((approval) => approval.id === data.id) ? prev : [...prev, data as ApprovalView],
        ),
    })
    const opens = api.agents.onOpenSheetRequested.subscribe(undefined, {
      onData: ({ data }) => {
        callbacks.current.onSheetsChanged()
        callbacks.current.onOpenSheet(data.id)
      },
    })
    return () => {
      updates.unsubscribe()
      requests.unsubscribe()
      opens.unsubscribe()
    }
  }, [])

  const send = async (text: string) => {
    if (!sessionId || !text.trim()) return
    setRunning(true)
    setError(null)
    try {
      await api.agents.prompt.mutate({ sessionId, text })
    } catch (cause) {
      setRunning(false)
      setError(String(cause))
    }
  }

  const stop = async () => {
    if (sessionId) await api.agents.cancel.mutate({ sessionId })
  }

  const decide = async (id: string, decision: ApprovalDecision) => {
    setApprovals((prev) => prev.filter((approval) => approval.id !== id))
    await api.agents.resolveApproval.mutate({ id, decision })
  }

  const reset = async () => {
    const session = await api.agents.createSession.mutate({
      title: `Session ${new Date().toLocaleTimeString()}`,
    })
    setSessionId(session.id)
    setTranscript([])
    setApprovals([])
  }

  return { sessionId, transcript, approvals, running, error, send, stop, decide, reset }
}
