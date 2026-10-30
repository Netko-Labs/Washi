import { mkdirSync } from 'node:fs'
import type { SDKUserMessage } from '@anthropic-ai/claude-agent-sdk'
import { query } from '@anthropic-ai/claude-agent-sdk'
import type { AgentUpdate, Member, TurnBilling } from '@washi/domain'
import { type ModelCatalogue, priceTurn } from '@washi/models'
import type { Workspace } from '@washi/repository'
import type { SearchKeyLookup } from '../lib'
import { agentEnv, MAX_PLAN_TURN_BUDGET_USD, MAX_TURN_BUDGET_USD, sessionConfigDir } from '../lib'
import { normalizeMessage } from '../normalize'
import { createWashiTools } from '../tools'
import {
  DISALLOWED_BUILTINS,
  MISSING_SESSION_PATTERN,
  PLAN_SOURCES,
  REJECTED_PATTERN,
} from './constants'
import type { AgentPort, PromptRequest, ToolVerdict, TurnResult } from './types'
import { createUsageTally } from './usage'

export interface ClaudeSdkPortDeps {
  ws: Workspace
  /** Prices a stopped turn, which the SDK never reports a total for. */
  catalogue: ModelCatalogue
  /** Read as each turn starts, so a change on the server reaches the next one. */
  instructions: () => string
  runHankoAction: (input: unknown) => Promise<void>
  openSheet?: (id: string) => void
  listPeople?: () => Promise<Member[]>
  searchKey?: SearchKeyLookup
  canUseTool: (
    sessionId: string,
    toolName: string,
    input: Record<string, unknown>,
  ) => Promise<ToolVerdict>
  /** The desk's `takeFetchGrant`: an approved off-list fetch reaches its one host. */
  fetchGrant?: (sessionId: string, url: string) => string | null
}

const REJECTED = {
  local_cli:
    'Claude Code on this computer is signed out. Run `claude` in a terminal, sign in, then ask again.',
  api_key: 'The model provider rejected this API key. Replace it in settings, then ask again.',
} as const

/**
 * The native path: the Claude Agent SDK drives a `claude` subprocess, which
 * keeps its own session and compacts its own context. With an API key it runs
 * the SDK's bundled binary; with `local_cli` it runs the person's install, and
 * that install's own login decides who pays.
 */
/** Text alone is a string; pictures ride as image blocks in one user message. */
function promptFor(request: PromptRequest): string | AsyncIterable<SDKUserMessage> {
  const images = request.images ?? []
  if (images.length === 0) return request.text
  const message: SDKUserMessage = {
    type: 'user',
    parent_tool_use_id: null,
    session_id: '',
    message: {
      role: 'user',
      content: [
        ...images.map((image) => ({
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: image.mime as 'image/jpeg' | 'image/png' | 'image/webp',
            data: image.base64,
          },
        })),
        { type: 'text' as const, text: request.text },
      ],
    },
  }
  return (async function* () {
    yield message
  })()
}

export function createClaudeSdkPort(deps: ClaudeSdkPortDeps): AgentPort {
  return {
    id: 'anthropic',

    async prompt(request: PromptRequest, emit: (update: AgentUpdate) => void): Promise<TurnResult> {
      const { credential } = request
      const local = credential.kind === 'local_cli'
      const onPlan = local && credential.plan
      if (request.signal?.aborted) {
        return {
          costUsd: null,
          billing: onPlan ? 'plan' : 'metered',
          resumeToken: request.resumeToken,
          cancelled: true,
        }
      }
      const abort = new AbortController()
      request.signal?.addEventListener('abort', () => abort.abort(), { once: true })

      let billing: TurnBilling = 'metered'
      let resumeToken = request.resumeToken ?? null
      let model: string | undefined
      let costUsd: number | null = null
      let error: string | undefined
      const usage = createUsageTally()
      const configDir = local ? null : sessionConfigDir(deps.ws.sqlite.filename)
      if (configDir) mkdirSync(configDir, { recursive: true })

      const run = async (resume: string | null) => {
        const stream = query({
          prompt: promptFor(request),
          options: {
            abortController: abort,
            resume: resume ?? undefined,
            model: request.model.model,
            effort: request.effort,
            pathToClaudeCodeExecutable: local ? credential.executable : undefined,
            mcpServers: {
              washi: createWashiTools(deps.ws, {
                runHankoAction: deps.runHankoAction,
                openSheet: deps.openSheet,
                listPeople: deps.listPeople,
                searchKey: deps.searchKey,
                setTitle: request.setTitle,
                handover: request.handover,
                viewer: request.viewer,
                fetchGrant: (url) => deps.fetchGrant?.(request.sessionId, url) ?? null,
              }),
            },
            strictMcpConfig: true,
            // Stream events carry usage from a response's first byte, which is what
            // prices a turn stopped mid-generation.
            includePartialMessages: true,
            tools: [],
            disallowedTools: DISALLOWED_BUILTINS,
            settingSources: [],
            // Notional on a plan, so a far higher ceiling — but never none: the probe
            // that said "plan" can be a minute stale.
            maxBudgetUsd: onPlan ? MAX_PLAN_TURN_BUDGET_USD : MAX_TURN_BUDGET_USD,
            // Replaces the subprocess env rather than merging — see agentEnv. A
            // local CLI gets no key at all, so it authenticates as its own login.
            env: agentEnv(local ? null : credential.apiKey, configDir),
            systemPrompt: deps.instructions(),
            canUseTool: async (toolName, input) =>
              deps.canUseTool(request.sessionId, toolName, input),
          },
        })

        try {
          for await (const message of stream) {
            request.onActivity?.()
            if (message.type === 'system' && message.subtype === 'init') {
              resumeToken = message.session_id
              model = message.model
              // Both must agree: the probe saw a subscription, and no key is in play.
              if (onPlan && PLAN_SOURCES.has(message.apiKeySource)) billing = 'plan'
              continue
            }
            if (message.type === 'stream_event') {
              if (message.event.type === 'message_start') {
                usage.started(message.event.message.id, message.event.message.usage)
              } else if (message.event.type === 'message_delta') {
                usage.delta(message.event.usage)
              }
              continue
            }
            if (message.type === 'assistant') {
              usage.completed(message.message.id, message.message.usage)
            }
            for (const update of normalizeMessage(message)) {
              if (update.kind === 'turn_done') {
                costUsd = update.costUsd ?? null
                if (update.stopReason === 'error') error = update.error ?? 'the turn failed'
                continue
              }
              emit(update)
            }
          }
        } catch (cause) {
          // The SDK throws on an error result rather than yielding it; it is still a turn.
          error = cause instanceof Error ? cause.message : String(cause)
        }
      }

      await run(request.resumeToken ?? null)
      // The session fails before any message, so nothing ran twice: start over, and
      // lose the history rather than the turn.
      if (request.resumeToken && error && MISSING_SESSION_PATTERN.test(error)) {
        error = undefined
        resumeToken = null
        await run(null)
      }

      if (abort.signal.aborted) {
        // The SDK reports no total for a stopped turn. Price what was spent, so a
        // Stop is never a way around the daily stop.
        if (costUsd == null && model) {
          costUsd = priceTurn(await deps.catalogue.model('anthropic', model), usage.total())
        }
        return { costUsd, billing, model, resumeToken, cancelled: true }
      }
      if (error && REJECTED_PATTERN.test(error)) error = REJECTED[credential.kind]

      return { costUsd, billing, model, resumeToken, error }
    },
  }
}
