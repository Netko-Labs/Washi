import {
  CATALOGUE_RETRY_MS,
  CATALOGUE_TTL_MS,
  FETCH_TIMEOUT_MS,
  MODELS_DEV_URL,
  SUPPORTED_PROVIDERS,
} from './constants'
import { FALLBACK_CATALOGUE } from './fallback'
import { type Catalogue, catalogueSchema, type ModelEntry, type ModelSummary } from './types'

export interface CatalogueOptions {
  url?: string
  ttlMs?: number
  retryMs?: number
  /** Providers to keep. The live index has 222; Washi can reach two. */
  providers?: readonly string[]
  fetchImpl?: typeof fetch
}

export interface ModelCatalogue {
  /** Cached; refreshes past the TTL and keeps the last good copy on failure. */
  load(): Promise<Catalogue>
  model(provider: string, id: string): Promise<ModelEntry | null>
  list(provider?: string): Promise<ModelSummary[]>
  /** Whether the last load came from the network or the bundled floor. */
  source(): 'network' | 'fallback' | 'unloaded'
}

function prune(raw: Catalogue, providers: readonly string[]): Catalogue {
  const kept: Catalogue = {}
  for (const id of providers) {
    const entry = raw[id]
    // Tool calling is not optional here: an agent that cannot call a tool
    // cannot write a sheet, so a model without it is noise in the picker.
    if (entry) {
      kept[id] = {
        ...entry,
        models: Object.fromEntries(
          Object.entries(entry.models).filter(([, model]) => model.tool_call !== false),
        ),
      }
    }
  }
  return kept
}

export function createModelCatalogue(options: CatalogueOptions = {}): ModelCatalogue {
  const url = options.url ?? MODELS_DEV_URL
  const ttlMs = options.ttlMs ?? CATALOGUE_TTL_MS
  const retryMs = options.retryMs ?? CATALOGUE_RETRY_MS
  const providers = options.providers ?? SUPPORTED_PROVIDERS
  const doFetch = options.fetchImpl ?? fetch

  let cached: Catalogue | null = null
  let cachedAt = 0
  let failedAt = Number.NEGATIVE_INFINITY
  let from: 'network' | 'fallback' | 'unloaded' = 'unloaded'
  let inflight: Promise<Catalogue> | null = null

  const fresh = () =>
    cached !== null && (Date.now() - cachedAt < ttlMs || Date.now() - failedAt < retryMs)

  async function refresh(): Promise<Catalogue> {
    try {
      const response = await doFetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
      if (!response.ok) throw new Error(`models.dev responded ${response.status}`)
      const parsed = catalogueSchema.parse(await response.json())
      cached = prune(parsed, providers)
      cachedAt = Date.now()
      from = 'network'
      return cached
    } catch {
      // A catalogue is a convenience, never a dependency. Keep the last good
      // copy if there is one; otherwise fall back to the bundled floor.
      if (cached) {
        failedAt = Date.now()
        return cached
      }
      cached = prune(FALLBACK_CATALOGUE, providers)
      cachedAt = Date.now()
      from = 'fallback'
      return cached
    }
  }

  return {
    async load() {
      if (fresh() && cached) return cached
      inflight ??= refresh().finally(() => {
        inflight = null
      })
      return inflight
    },

    async model(provider, id) {
      const catalogue = await this.load()
      return catalogue[provider]?.models[id] ?? null
    },

    async list(provider) {
      const catalogue = await this.load()
      const entries = provider
        ? ([[provider, catalogue[provider]]] as const)
        : (Object.entries(catalogue) as [string, (typeof catalogue)[string]][])

      const summaries: ModelSummary[] = []
      for (const [providerId, entry] of entries) {
        if (!entry) continue
        for (const model of Object.values(entry.models)) {
          summaries.push({
            provider: providerId,
            providerName: entry.name ?? providerId,
            id: model.id,
            // models.dev tags an alias "(latest)" even once a newer family ships.
            name: (model.name ?? model.id).replace(/\s*\(latest\)$/, ''),
            contextTokens: model.limit?.context ?? null,
            inputPerMTok: model.cost?.input ?? null,
            outputPerMTok: model.cost?.output ?? null,
            reasoning: model.reasoning === true,
            releasedAt: model.release_date ?? null,
          })
        }
      }
      // Newest first: the model a person wants is almost never the oldest one.
      return summaries.sort(
        (a, b) =>
          (b.releasedAt ?? '').localeCompare(a.releasedAt ?? '') || a.name.localeCompare(b.name),
      )
    },

    source: () => from,
  }
}
