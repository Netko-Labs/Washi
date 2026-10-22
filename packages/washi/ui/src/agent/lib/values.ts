import type { EffortChoice, ModelChoice } from './types'

/** Three per provider, one line each — the same three Settings recommends. */
export const RECOMMENDED_MODELS: Record<string, ModelChoice[]> = {
  anthropic: [
    { id: 'claude-sonnet-4-5', label: 'Sonnet 4.5', desc: 'Balanced' },
    { id: 'claude-opus-4-1', label: 'Opus 4.1', desc: 'Deepest · slower' },
    { id: 'claude-haiku-4-5', label: 'Haiku 4.5', desc: 'Fastest · cheapest' },
  ],
  openrouter: [
    { id: 'anthropic/claude-sonnet-4.5', label: 'Sonnet 4.5', desc: 'Balanced' },
    { id: 'anthropic/claude-opus-4.1', label: 'Opus 4.1', desc: 'Deepest · slower' },
    { id: 'anthropic/claude-haiku-4.5', label: 'Haiku 4.5', desc: 'Fastest · cheapest' },
  ],
}

/** The desktop's local Claude Code has its own four; this menu never shows anything else there. */
export const LOCAL_MODELS: ModelChoice[] = [
  { id: 'default', label: 'Default', desc: "Claude Code's own choice" },
  { id: 'opus', label: 'Opus', desc: 'Deepest · spends plan limits fastest' },
  { id: 'sonnet', label: 'Sonnet', desc: 'Balanced' },
  { id: 'haiku', label: 'Haiku', desc: 'Fastest' },
]

export const EFFORTS: EffortChoice[] = [
  { id: 'quick', label: 'Quick', desc: 'Short answers, no planning' },
  { id: 'balanced', label: 'Balanced', desc: 'Reads what it needs' },
  { id: 'deep', label: 'Deep', desc: 'Plans, checks its own work, longer' },
]

export const MAX_ATTACHMENTS = 8
export const UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp,text/*,.csv,.md,.json'
