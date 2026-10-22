import { IconRobot, IconRoute, IconUsers } from '@tabler/icons-react'
import type {
  ApprovalMode,
  Effort,
  Option,
  ProviderMeta,
  RecommendedModel,
  ResumeBy,
} from './types'

export const PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic', hint: 'sk-ant-…' },
  { id: 'openrouter', label: 'OpenRouter', hint: 'sk-or-…' },
] as const

export const PROVIDER_META: Record<'anthropic' | 'openrouter' | 'exa', ProviderMeta> = {
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    mark: 'A',
    tint: 'bg-[#1f1d1a] text-[#f4efe6]',
    hint: 'sk-ant-…',
    from: 'console.anthropic.com',
    blurb: 'Claude, through the native Agent SDK',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    mark: 'OR',
    tint: 'bg-[#5b4bd6] text-white',
    hint: 'sk-or-…',
    from: 'openrouter.ai',
    blurb: "one key, every provider's models",
  },
  exa: {
    id: 'exa',
    label: 'Web search · Exa',
    mark: 'ex',
    tint: 'bg-[#2e5a8c] text-white',
    hint: 'exa-…',
    from: 'exa.ai',
    blurb: 'searches still ask until allowed always',
  },
}

export const SETTINGS_TABS = [
  {
    key: 'agent',
    label: 'Agent',
    icon: IconRobot,
    desc: 'What Washi thinks with, what leaves the server, and the stop.',
  },
  {
    key: 'people',
    label: 'People',
    icon: IconUsers,
    desc: 'Who is in this workspace, and who is invited.',
  },
  {
    key: 'routines',
    label: 'Routines',
    icon: IconRoute,
    desc: 'What Washi does while nobody is watching.',
  },
] as const

export const SETTINGS_TAB_KEYS = ['agent', 'people', 'routines'] as const

export const APPROVAL_MODE_OPTIONS: readonly Option<ApprovalMode>[] = [
  {
    id: 'ask',
    label: 'Ask',
    desc: 'Fetches, searches and actions wait for a person. Nothing leaves without one.',
  },
  {
    id: 'auto',
    label: 'Auto',
    desc: 'A standing yes from this workspace. Each call is still written to the ledger.',
  },
]

export const EFFORT_OPTIONS: readonly Option<Effort>[] = [
  { id: 'quick', label: 'Quick', desc: 'Short answers, no planning.' },
  { id: 'balanced', label: 'Balanced', desc: 'Reads what it needs.' },
  { id: 'deep', label: 'Deep', desc: 'Plans, checks its own work, takes longer.' },
]

export const RESUME_BY_OPTIONS: readonly Option<ResumeBy>[] = [
  { id: 'anyone', label: 'Anyone', desc: 'Anyone on the team can resume Washi.' },
  { id: 'owners', label: 'Owners', desc: 'Only an owner or admin can resume Washi.' },
]

/** Three per provider, with one line each; the rest of the catalogue sits under them. */
export const RECOMMENDED: Record<string, RecommendedModel[]> = {
  anthropic: [
    { id: 'claude-sonnet-4-5', desc: 'Balanced — reads what it needs, writes well' },
    { id: 'claude-opus-4-1', desc: 'Deepest — plans and checks, slower' },
    { id: 'claude-haiku-4-5', desc: 'Fastest — short answers, cheapest' },
  ],
  openrouter: [
    { id: 'anthropic/claude-sonnet-4.5', desc: 'Balanced — reads what it needs, writes well' },
    { id: 'anthropic/claude-opus-4.1', desc: 'Deepest — plans and checks, slower' },
    { id: 'anthropic/claude-haiku-4.5', desc: 'Fastest — short answers, cheapest' },
  ],
}

export const MODEL_MENU_LIMIT = 60
