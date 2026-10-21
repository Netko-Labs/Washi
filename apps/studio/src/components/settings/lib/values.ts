import { IconRobot, IconRoute, IconUsers } from '@tabler/icons-react'

export const PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic', hint: 'sk-ant-…' },
  { id: 'openrouter', label: 'OpenRouter', hint: 'sk-or-…' },
] as const

export const SETTINGS_TABS = [
  {
    key: 'agent',
    label: 'Agent',
    icon: IconRobot,
    desc: 'What Washi thinks with, and what it cost today.',
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

export const APPROVAL_MODE_OPTIONS = [
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
] as const
