import type { EffortChoice, ModelChoice } from './types'

/** Three per provider, one line each — the same three Settings recommends. */
export const RECOMMENDED_MODELS: Record<string, ModelChoice[]> = {
  anthropic: [
    { id: 'claude-sonnet-5-5', label: 'Sonnet 5.5', desc: 'Balanced' },
    { id: 'claude-opus-5-5', label: 'Opus 5.5', desc: 'Deepest · slower' },
    { id: 'claude-haiku-5-5', label: 'Haiku 5.5', desc: 'Fastest · cheapest' },
  ],
  openrouter: [
    { id: 'anthropic/claude-sonnet-5.5', label: 'Sonnet 5.5', desc: 'Balanced' },
    { id: 'anthropic/claude-opus-5.5', label: 'Opus 5.5', desc: 'Deepest · slower' },
    { id: 'anthropic/claude-haiku-5.5', label: 'Haiku 5.5', desc: 'Fastest · cheapest' },
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

/** The composer grows to this share of its room — the panel, or the page's viewport. */
export const COMPOSER_SHARE = 0.4
export const COMPOSER_MIN_CAP_PX = 96

export const ATTACH_PAGE_ROWS = 8

/** How close to the end of the transcript still counts as reading the end, in px. */
export const NEAR_END_PX = 48
