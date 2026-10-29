import type { AgentKeySource, InferenceStatus } from '../lib'
import type { ProviderId } from '../ports'
import type { ApiKeyCredential, StoredKey, StoredKeyLookup } from './types'
import { MISSING } from './values'

const PROVIDERS: readonly ProviderId[] = ['anthropic', 'openrouter']

/**
 * A hosted workspace runs on its own stored key and nothing else. There is no
 * local CLI branch here at all: a team server running one person's Claude login
 * would bill a subscription for everyone's turns.
 */
export function createStoredKeySource(lookup: StoredKeyLookup): AgentKeySource {
  const credentialOf = (stored: StoredKey | null): ApiKeyCredential | null => {
    if (!stored) return null
    return {
      kind: 'api_key',
      apiKey: stored.apiKey,
      provider: PROVIDERS.find((id) => id === stored.provider) ?? 'anthropic',
      model: stored.model ?? undefined,
    }
  }

  return {
    resolve: async () => credentialOf(await lookup()),
    async status(): Promise<InferenceStatus> {
      const stored = await lookup()
      const credential = credentialOf(stored)
      const source = stored?.source ?? 'workspace'
      return {
        preference: 'api_key',
        active: credential ? 'api_key' : null,
        localCli: null,
        localModel: null,
        apiKey: credential ? { provider: credential.provider, source } : null,
        missing: credential ? null : MISSING.workspaceKeyAbsent,
      }
    },
  }
}
