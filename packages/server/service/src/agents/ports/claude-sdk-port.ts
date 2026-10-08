import { query } from '@anthropic-ai/claude-agent-sdk'
import type { AgentUpdate, TurnBilling } from '@washi/domain'
import type { Workspace } from '@washi/repository'
import { agentEnv, MAX_TURN_BUDGET_USD } from '../lib'
import { normalizeMessage } from '../normalize'
import { createWashiTools } from '../tools'
import { DISALLOWED_BUILTINS, KEYED_SOURCES, SIGNED_OUT_PATTERN } from './constants'
import type { AgentPort, PromptRequest, ToolVerdict, TurnResult } from './types'

export interface ClaudeSdkPortDeps {
  ws: Workspace
  instructions: string
  runHankoAction: (input: unknown) => Promise<void>
  canUseTool: (
    sessionId: string,
    toolName: string,
    input: Record<string, unknown>,
  ) => Promise<ToolVerdict>
}

const SIGNED_OUT_MESSAGE =
  'Claude Code on this computer is signed out. Run `claude` in a terminal, sign in, then ask again.'

/**
 * The native path: the Claude Agent SDK drives a `claude` subprocess, which
 * keeps its own session and compacts its own context. With an API key it runs
 * the SDK's bundled binary; with `local_cli` it runs the person's install, and
 * that install's own login decides who pays.
 */
export function createClaudeSdkPort(deps: ClaudeSdkPortDeps): AgentPort {
  return {
    id: 'anthropic',

    async prompt(request: PromptRequest, emit: (update: AgentUpdate) => void): Promise<TurnResult> {
      const { credential } = request
      const local = credential.kind === 'local_cli'
      const abort = new AbortController()
      request.signal?.addEventListener('abort', () => abort.abort(), { once: true })

      let billing: TurnBilling = 'metered'
      let resumeToken = request.resumeToken ?? null
      let model: string | undefined
      let costUsd: number | null = null
      let error: string | undefined
      let lastText = ''

      const stream = query({
        prompt: request.text,
        options: {
          abortController: abort,
          resume: request.resumeToken ?? undefined,
          model: request.model.model,
          pathToClaudeCodeExecutable: local ? credential.executable : undefined,
          mcpServers: {
            washi: createWashiTools(deps.ws, { runHankoAction: deps.runHankoAction }),
          },
          strictMcpConfig: true,
          tools: [],
          disallowedTools: DISALLOWED_BUILTINS,
          settingSources: [],
          maxBudgetUsd: MAX_TURN_BUDGET_USD,
          // Replaces the subprocess env rather than merging — see agentEnv. A
          // local CLI gets no key at all, so it authenticates as its own login.
          env: agentEnv(local ? null : credential.apiKey),
          systemPrompt: deps.instructions,
          canUseTool: async (toolName, input) =>
            deps.canUseTool(request.sessionId, toolName, input),
        },
      })

      for await (const message of stream) {
        if (message.type === 'system' && message.subtype === 'init') {
          resumeToken = message.session_id
          model = message.model
          // A claude.ai login reports `none` or `oauth`; a console key still bills per token.
          if (local && !KEYED_SOURCES.has(message.apiKeySource)) billing = 'plan'
          continue
        }
        for (const update of normalizeMessage(message)) {
          if (update.kind === 'turn_done') {
            costUsd = update.costUsd ?? null
            if (update.stopReason === 'error') error = update.error ?? 'the turn failed'
            continue
          }
          if (update.kind === 'message_chunk') lastText = update.text
          emit(update)
        }
      }

      if (local && SIGNED_OUT_PATTERN.test(error ? `${error} ${lastText}` : '')) {
        error = SIGNED_OUT_MESSAGE
      }

      return { costUsd, billing, model, resumeToken, error }
    },
  }
}
