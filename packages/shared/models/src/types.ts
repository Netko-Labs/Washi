import { z } from 'zod'

/** The slice of models.dev Washi reads. Unknown fields are dropped, not rejected. */
export const modelCostSchema = z.object({
  input: z.number().optional(),
  output: z.number().optional(),
  cache_read: z.number().optional(),
  cache_write: z.number().optional(),
})

export const modelEntrySchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  tool_call: z.boolean().optional(),
  reasoning: z.boolean().optional(),
  cost: modelCostSchema.optional(),
  limit: z.object({ context: z.number().optional(), output: z.number().optional() }).optional(),
  release_date: z.string().optional(),
})

export const providerEntrySchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  /** The AI SDK provider package, e.g. '@openrouter/ai-sdk-provider'. */
  npm: z.string().optional(),
  env: z.array(z.string()).optional(),
  doc: z.string().optional(),
  models: z.record(z.string(), modelEntrySchema).default({}),
})

export const catalogueSchema = z.record(z.string(), providerEntrySchema)

export type ModelCost = z.infer<typeof modelCostSchema>
export type ModelEntry = z.infer<typeof modelEntrySchema>
export type ProviderEntry = z.infer<typeof providerEntrySchema>
export type Catalogue = z.infer<typeof catalogueSchema>

/** What a picker needs, flattened. */
export interface ModelSummary {
  provider: string
  providerName: string
  id: string
  name: string
  contextTokens: number | null
  inputPerMTok: number | null
  outputPerMTok: number | null
  reasoning: boolean
  /** YYYY-MM-DD, or null when models.dev does not say. */
  releasedAt: string | null
}

export interface TokenUsage {
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
}
