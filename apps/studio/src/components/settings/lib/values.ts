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
