import { turnViewOf, useAgentStore } from '@washi/ui'
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { chatBlocks } from '../utils'
import { useStickToBottom } from './use-stick-to-bottom'

/** The open chat as blocks, its own waiting questions, and the scroll that follows the end. */
export function useChatThread() {
  const { transcript, running, approvals, activeSessionId, turn, failureId } = useAgentStore(
    useShallow((state) => {
      const view = turnViewOf(state)
      return {
        transcript: state.transcript,
        running: state.running,
        approvals: state.approvals,
        activeSessionId: state.activeSessionId,
        turn: view.state,
        failureId: view.failureId,
      }
    }),
  )
  const blocks = useMemo(() => chatBlocks(transcript), [transcript])
  const asks = approvals.filter((request) => request.sessionId === activeSessionId)
  const stick = useStickToBottom(
    `${transcript.length}:${asks.length}:${running}:${turn}`,
    transcript.at(-1)?.update.kind === 'user_message',
  )
  return { blocks, asks, turn, failureId, stick }
}
