import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/rpc'
import type { ApprovalDecision, ApprovalView, TranscriptEntryView } from '../types'

/**
 * One conversation, streamed. The subscription resumes from `lastEventId`, so a
 * closed laptop rejoins mid-turn instead of losing the middle of it.
 */
export function useAgent(workspaceId: string, onSheetsChanged: () => void) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntryView[]>([])
  const [approvals, setApprovals] = useState<ApprovalView[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const active = useRef<string | null>(null)

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
          onSheetsChanged()
        }
      },
      onError: (cause) => setError(String(cause)),
    })
    const requests = api.agents.onApprovalRequested.subscribe(undefined, {
      onData: ({ data }) => setApprovals((prev) => [...prev, data as ApprovalView]),
    })
    return () => {
      updates.unsubscribe()
      requests.unsubscribe()
    }
  }, [onSheetsChanged])

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

  return { sessionId, transcript, approvals, running, error, send, decide, reset }
}
