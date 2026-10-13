import type { TokenUsage } from '@washi/models'

interface ClaudeUsage {
  input_tokens?: number | null
  output_tokens?: number | null
  cache_read_input_tokens?: number | null
  cache_creation_input_tokens?: number | null
}

interface Tally {
  input: number
  output: number
  cached: number
}

/**
 * What a turn has spent so far, per API response. A response is counted from its
 * first stream event — not only once complete — so a Stop mid-generation still
 * pays for the prompt it sent. Usage only grows, so the largest figure wins.
 */
export function createUsageTally() {
  const responses = new Map<string, Tally>()
  let current: string | null = null

  const merge = (id: string, usage: ClaudeUsage) => {
    const cached = usage.cache_read_input_tokens ?? 0
    const input = (usage.input_tokens ?? 0) + cached + (usage.cache_creation_input_tokens ?? 0)
    const previous = responses.get(id) ?? { input: 0, output: 0, cached: 0 }
    responses.set(id, {
      input: Math.max(previous.input, input),
      output: Math.max(previous.output, usage.output_tokens ?? 0),
      cached: Math.max(previous.cached, cached),
    })
  }

  return {
    started(id: string, usage: ClaudeUsage) {
      current = id
      merge(id, usage)
    },
    /** message_delta carries no id; it belongs to the response that started last. */
    delta(usage: ClaudeUsage) {
      if (current) merge(current, usage)
    },
    completed(id: string, usage: ClaudeUsage) {
      merge(id, usage)
    },
    total(): TokenUsage {
      let inputTokens = 0
      let outputTokens = 0
      let cachedInputTokens = 0
      for (const tally of responses.values()) {
        inputTokens += tally.input
        outputTokens += tally.output
        cachedInputTokens += tally.cached
      }
      return { inputTokens, outputTokens, cachedInputTokens }
    },
  }
}
