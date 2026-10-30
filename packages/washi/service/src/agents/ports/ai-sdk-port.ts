import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import type { AgentUpdate, Member } from '@washi/domain'
import { type ModelCatalogue, priceTurn } from '@washi/models'
import type { Workspace } from '@washi/repository'
import { type LanguageModel, stepCountIs, ToolLoopAgent } from 'ai'
import type { SearchKeyLookup } from '../lib'
import { createAiTools, isReadTool } from './ai-sdk-tools'
import { MAX_STEPS } from './constants'
import { defaultModelFor } from './defaults'
import type { AgentPort, PromptRequest, ToolGate, TurnResult } from './types'

export interface AiSdkPortDeps {
  ws: Workspace
  gate: ToolGate
  runHankoAction: (input: unknown) => Promise<void>
  openSheet?: (id: string) => void
  listPeople?: () => Promise<Member[]>
  searchKey?: SearchKeyLookup
  /** Read as each turn starts, so a change on the server reaches the next one. */
  instructions: () => string
  /** Prices the turn, so the daily breaker works on a provider that bills tokens. */
  catalogue: ModelCatalogue
}

function resolveModel(provider: string, model: string, apiKey: string): LanguageModel {
  if (provider === 'openrouter') return createOpenRouter({ apiKey })(model)
  return createAnthropic({ apiKey })(model)
}

/**
 * The provider-agnostic port. Everything Washi cares about — which tools exist,
 * which of them stop at the approvals desk, what a turn looks like in the
 * transcript — is decided here; the model is a string and a key.
 */
export function createAiSdkPort({
  ws,
  gate,
  runHankoAction,
  openSheet,
  listPeople,
  searchKey,
  instructions,
  catalogue,
}: AiSdkPortDeps): AgentPort {
  return {
    id: 'openrouter',

    async prompt(request: PromptRequest, emit: (update: AgentUpdate) => void): Promise<TurnResult> {
      const { credential } = request
      if (credential.kind !== 'api_key') {
        throw new Error('the AI SDK port runs on an API key, never a local CLI login')
      }
      const tools = createAiTools({
        ws,
        runHankoAction,
        openSheet,
        listPeople,
        searchKey,
        setTitle: request.setTitle,
        handover: request.handover,
        viewer: request.viewer,
      })
      const model =
        request.model.model ?? (await defaultModelFor(catalogue, request.model.provider))

      const agent = new ToolLoopAgent({
        model: resolveModel(request.model.provider, model, credential.apiKey),
        instructions: instructions(),
        tools,
        stopWhen: stepCountIs(MAX_STEPS),
        // One gate, both ports. Reads and page/table writes pass; what leaves waits for a person,
        // through the same desk a sheet's action goes through (spec §09 P4).
        toolApproval: async ({ toolCall }) => {
          if (gate.isRead(toolCall.toolName)) return 'not-applicable'
          const allowed = await gate.approve(request.sessionId, toolCall.toolName, toolCall.input)
          return allowed ? 'approved' : 'denied'
        },
      })

      const stream = await agent.stream({
        messages: [
          ...request.history.map((entry) => ({ role: entry.role, content: entry.text })),
          {
            role: 'user' as const,
            content: request.images?.length
              ? `${request.text}\n\n(${request.images.length} picture(s) were attached, but this path cannot see pictures yet.)`
              : request.text,
          },
        ],
        abortSignal: request.signal,
      })

      const seen = new Set<string>()
      // Per-step usage, so a Stop still knows what it spent.
      const spent = { inputTokens: 0, outputTokens: 0, cachedInputTokens: 0 }

      try {
        for await (const part of stream.fullStream) {
          request.onActivity?.()
          if (part.type === 'text-delta' && part.text) {
            emit({ kind: 'message_chunk', text: part.text })
            continue
          }
          if (part.type === 'tool-call') {
            seen.add(part.toolCallId)
            emit({
              kind: 'tool_call',
              toolCallId: part.toolCallId,
              title: part.toolName,
              toolKind: isReadTool(part.toolName) ? 'read' : 'edit',
              status: 'in_progress',
              input: part.input,
            })
            continue
          }
          if (part.type === 'tool-result' && seen.has(part.toolCallId)) {
            emit({
              kind: 'tool_call_update',
              toolCallId: part.toolCallId,
              status: 'completed',
            })
            continue
          }
          if (part.type === 'finish-step') {
            spent.inputTokens += part.usage.inputTokens ?? 0
            spent.outputTokens += part.usage.outputTokens ?? 0
            spent.cachedInputTokens += part.usage.inputTokenDetails?.cacheReadTokens ?? 0
            continue
          }
          if (part.type === 'tool-error' && seen.has(part.toolCallId)) {
            emit({ kind: 'tool_call_update', toolCallId: part.toolCallId, status: 'failed' })
          }
        }
      } catch (cause) {
        if (!request.signal?.aborted) throw cause
      }
      if (request.signal?.aborted) {
        const entry = await catalogue.model(request.model.provider, model)
        // A stopped turn still spent tokens; pricing them keeps Stop from
        // being a way around the daily stop.
        return { costUsd: priceTurn(entry, spent), billing: 'metered', model, cancelled: true }
      }

      // models.dev publishes per-MTok prices, so a provider that bills in
      // tokens still produces a dollar figure the daily breaker can act on.
      // An unpriced model yields null rather than zero — a free-looking turn
      // would wave an unknown model straight past the cap.
      const usage = await stream.usage
      const entry = await catalogue.model(request.model.provider, model)
      return {
        billing: 'metered',
        model,
        costUsd: priceTurn(entry, {
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
          cachedInputTokens: usage?.inputTokenDetails?.cacheReadTokens,
        }),
      }
    },
  }
}
