import { getAppMeta, setAppMeta, type Workspace } from '@washi/repository'
import type {
  AgentCredential,
  AgentKeySource,
  InferencePreference,
  InferenceStatus,
  LocalModel,
} from '../lib'
import {
  INFERENCE_PREFERENCE_KEY,
  INFERENCE_PREFERENCES,
  LOCAL_MODEL_KEY,
  LOCAL_MODELS,
  PLAN_AUTH_METHOD,
} from './constants'
import { cachedProbe } from './local-cli'
import type { ApiKeyCredential, LocalCliProbe } from './types'
import { MISSING } from './values'

export function parsePreference(raw: string | null | undefined): InferencePreference {
  return INFERENCE_PREFERENCES.find((preference) => preference === raw) ?? 'auto'
}

export function parseLocalModel(raw: string | null | undefined): LocalModel {
  return LOCAL_MODELS.find((model) => model === raw) ?? 'default'
}

/**
 * The desktop's answer to "who pays for this turn". `auto` prefers the person's
 * own Claude Code login, because a plan they already pay for beats a key that
 * bills per token; the machine's ANTHROPIC_API_KEY is the fallback.
 */
export function createEmbeddedKeySource(
  ws: Workspace,
  probe: LocalCliProbe = cachedProbe(),
  env: Record<string, string | undefined> = process.env,
): AgentKeySource {
  const envKey = (): ApiKeyCredential | null => {
    const apiKey = env.ANTHROPIC_API_KEY
    return apiKey ? { kind: 'api_key', apiKey, provider: 'anthropic' } : null
  }

  const decide = async (): Promise<InferenceStatus & { credential: AgentCredential | null }> => {
    const preference = parsePreference(getAppMeta(ws, INFERENCE_PREFERENCE_KEY))
    const localModel = parseLocalModel(getAppMeta(ws, LOCAL_MODEL_KEY))
    const cli = await probe()
    const key = envKey()

    let credential: AgentCredential | null = null
    if (preference !== 'api_key' && cli?.loggedIn) {
      credential = {
        kind: 'local_cli',
        executable: cli.executable,
        provider: 'anthropic',
        plan: cli.authMethod === PLAN_AUTH_METHOD,
        ...(localModel === 'default' ? {} : { model: localModel }),
      }
    } else if (preference !== 'local_cli') {
      credential = key
    }

    let missing: string | null = null
    if (!credential) {
      if (preference === 'api_key') missing = MISSING.envKeyAbsent
      else if (preference === 'local_cli') missing = cli ? MISSING.cliSignedOut : MISSING.cliAbsent
      else missing = cli && !cli.loggedIn ? MISSING.cliSignedOut : MISSING.nothing
    }

    return {
      preference,
      active: credential?.kind ?? null,
      localCli: cli,
      localModel,
      apiKey: key ? { provider: 'anthropic', source: 'environment', model: null } : null,
      missing,
      credential,
    }
  }

  const status = async (): Promise<InferenceStatus> => {
    const { credential: _credential, ...rest } = await decide()
    return rest
  }

  return {
    resolve: async () => (await decide()).credential,
    status,
    async setPreference(preference) {
      setAppMeta(ws, INFERENCE_PREFERENCE_KEY, preference)
      return status()
    },
    async setLocalModel(model) {
      setAppMeta(ws, LOCAL_MODEL_KEY, model)
      return status()
    },
  }
}
