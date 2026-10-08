import type { InferencePreference } from './types'

export const PREFERENCE_LABELS: { value: InferencePreference; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'local_cli', label: 'Claude Code' },
  { value: 'api_key', label: 'API key' },
]
