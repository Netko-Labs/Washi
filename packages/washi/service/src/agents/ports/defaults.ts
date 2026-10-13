import type { ModelCatalogue } from '@washi/models'
import { LAST_RESORT_MODELS, MIN_SERIOUS_PRICE, PREFERRED_MODELS } from './constants'

/**
 * The model a workspace gets when it names a provider but no model. The
 * catalogue says what exists and what it costs; the preference list says what
 * is worth handing to someone who did not choose. Cheapest-wins would pick a
 * free preview, which is not a default, it is a disappointment.
 */
export async function defaultModelFor(
  catalogue: ModelCatalogue,
  provider: string,
): Promise<string> {
  const available = await catalogue.list(provider)
  const ids = new Set(available.map((model) => model.id))

  for (const preferred of PREFERRED_MODELS[provider] ?? []) {
    if (ids.has(preferred)) return preferred
  }

  // Nothing preferred is available — fall back to the cheapest model that
  // someone is actually charging for, which filters out previews.
  const paid = available
    .filter((model) => (model.inputPerMTok ?? 0) > MIN_SERIOUS_PRICE)
    .sort((a, b) => (a.inputPerMTok ?? 0) - (b.inputPerMTok ?? 0))

  return paid[0]?.id ?? available[0]?.id ?? LAST_RESORT_MODELS[provider] ?? 'claude-sonnet-5'
}
