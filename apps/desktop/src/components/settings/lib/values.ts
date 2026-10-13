import type { InferencePreference, LocalModel } from './types'

export const PREFERENCE_LABELS: { value: InferencePreference; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'local_cli', label: 'Claude Code' },
  { value: 'api_key', label: 'API key' },
]

export const LOCAL_MODEL_LABELS: { value: LocalModel; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'opus', label: 'Opus' },
  { value: 'sonnet', label: 'Sonnet' },
  { value: 'haiku', label: 'Haiku' },
]
