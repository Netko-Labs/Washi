import type { Catalogue } from './types'

/**
 * Enough catalogue to work with no network. Washi is a local-first product that
 * happens to read a remote index; if models.dev is unreachable, a workspace
 * still has models it can name and prices the breaker can use.
 *
 * Deliberately tiny — the live catalogue is ~4.7MB and 222 providers. This is
 * the floor, not a mirror.
 */
export const FALLBACK_CATALOGUE: Catalogue = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    npm: '@ai-sdk/anthropic',
    env: ['ANTHROPIC_API_KEY'],
    models: {
      'claude-opus-5': {
        id: 'claude-opus-5',
        name: 'Claude Opus 5',
        tool_call: true,
        reasoning: true,
        cost: { input: 5, output: 25 },
        limit: { context: 1_000_000, output: 128_000 },
      },
      'claude-sonnet-5': {
        id: 'claude-sonnet-5',
        name: 'Claude Sonnet 5',
        tool_call: true,
        reasoning: true,
        cost: { input: 2, output: 10 },
        limit: { context: 1_000_000, output: 128_000 },
      },
      'claude-haiku-4-5': {
        id: 'claude-haiku-4-5',
        name: 'Claude Haiku 4.5',
        tool_call: true,
        cost: { input: 1, output: 5 },
        limit: { context: 200_000, output: 64_000 },
      },
    },
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    npm: '@openrouter/ai-sdk-provider',
    env: ['OPENROUTER_API_KEY'],
    models: {
      'anthropic/claude-opus-5': {
        id: 'anthropic/claude-opus-5',
        name: 'Claude Opus 5',
        tool_call: true,
        reasoning: true,
        cost: { input: 5, output: 25 },
        limit: { context: 1_000_000, output: 128_000 },
      },
      'anthropic/claude-sonnet-5': {
        id: 'anthropic/claude-sonnet-5',
        name: 'Claude Sonnet 5',
        tool_call: true,
        reasoning: true,
        cost: { input: 2, output: 10 },
        limit: { context: 1_000_000, output: 128_000 },
      },
    },
  },
}
