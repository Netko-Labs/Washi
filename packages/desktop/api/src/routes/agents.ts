import type {
  AgentSession,
  ApprovalDecision,
  ApprovalRequest,
  TranscriptEntry,
} from '@washi/desktop-domain'
import { createSession, getTranscript, listSessions } from '@washi/desktop-repository'
import type { AgentHost } from '@washi/desktop-service'
import { rpc } from 'mirinjs/rpc'

export function agentRoutes(host: AgentHost) {
  return {
    listSessions: rpc.query((): AgentSession[] => listSessions()),
    createSession: rpc.mutation(
      ({ title }: { title: string }): AgentSession => createSession(title),
    ),
    getTranscript: rpc.query(({ sessionId }: { sessionId: string }): TranscriptEntry[] =>
      getTranscript(sessionId),
    ),
    // Fire-and-forget: updates stream back over the agentUpdate event.
    promptAgent: rpc.mutation(({ sessionId, text }: { sessionId: string; text: string }): void => {
      void host.prompt(sessionId, text)
    }),
    resolveApproval: rpc.mutation(
      ({ id, decision }: { id: string; decision: ApprovalDecision }): void => {
        host.resolveApprovalRequest(id, decision)
      },
    ),

    agentUpdate: rpc.event<{ sessionId: string; entry: TranscriptEntry }>(),
    approvalRequested: rpc.event<ApprovalRequest>(),
    openSheetRequested: rpc.event<{ id: string }>(),
  }
}
