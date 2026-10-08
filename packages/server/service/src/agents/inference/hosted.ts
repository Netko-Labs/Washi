import type { AgentKeySource, InferenceStatus } from '../lib'
import type { ProviderId } from '../ports'
import type { ApiKeyCredential, StoredKeyLookup } from './types'
import { MISSING } from './values'

const PROVIDERS: readonly ProviderId[] = ['anthropic', 'openrouter']

/**
 * A hosted workspace runs on its own stored key and nothing else. There is no
 * local CLI branch here at all: a team server running one person's Claude login
 * would bill a subscription for everyone's turns.
 */
export function createStoredKeySource(lookup: StoredKeyLookup): AgentKeySource {
  const resolve = async (): Promise<ApiKeyCredential | null> => {
    const stored = await lookup()
    if (!stored) return null
    return {
      kind: 'api_key',
      apiKey: stored.apiKey,
      provider: PROVIDERS.find((id) => id === stored.provider) ?? 'anthropic',
      model: stored.model ?? undefined,
    }
  }

  return {
    resolve,
    async status(): Promise<InferenceStatus> {
      const credential = await resolve()
      return {
        preference: 'api_key',
        active: credential ? 'api_key' : null,
        localCli: null,
        apiKey: credential ? { provider: credential.provider, source: 'workspace' } : null,
        missing: credential ? null : MISSING.workspaceKeyAbsent,
      }
    },
  }
}
