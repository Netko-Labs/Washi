import {
  IconAdjustments,
  IconBucket,
  IconBuildingCommunity,
  IconGauge,
  IconMoodSmile,
  IconPalette,
  IconServer,
  IconSparkles,
  IconUserCircle,
  IconUsers,
  IconWorld,
} from '@tabler/icons-react'
import type {
  ApprovalMode,
  Effort,
  Option,
  ProviderMeta,
  RecommendedModel,
  ResumeBy,
  SettingsGroup,
  SettingsTab,
  SignupMode,
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

/** Account is yours, Workspace is the team's, Washi is the agent's; Server is the app admin's. */
export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    label: 'Account',
    sections: [
      { key: 'profile', label: 'Profile', icon: IconUserCircle, desc: 'How the team sees you.' },
      {
        key: 'preferences',
        label: 'Preferences',
        icon: IconAdjustments,
        desc: 'How Washi looks for you, on this device.',
      },
    ],
  },
  {
    label: 'Workspace',
    sections: [
      {
        key: 'general',
        label: 'General',
        icon: IconBuildingCommunity,
        desc: 'The workspace’s name and where to find it.',
      },
      {
        key: 'people',
        label: 'People',
        icon: IconUsers,
        desc: 'Who is in this workspace, and who is invited.',
      },
      {
        key: 'storage',
        label: 'Storage',
        icon: IconBucket,
        desc: 'Where the covers, icons and pictures people upload are kept.',
      },
      {
        key: 'emojis',
        label: 'Emojis',
        icon: IconMoodSmile,
        desc: 'The team’s own pictures, for page icons, by :name:.',
      },
      {
        key: 'themes',
        label: 'Themes',
        icon: IconPalette,
        desc: 'Page themes the team made or brought in — eight colours a mode, checked for contrast.',
      },
    ],
  },
  {
    label: 'Washi',
    sections: [
      {
        key: 'models',
        label: 'Models',
        icon: IconSparkles,
        desc: 'The key Washi runs on, the models the team can pick, and how hard it thinks.',
      },
      {
        key: 'outside',
        label: 'What leaves',
        icon: IconWorld,
        desc: 'Fetches, searches and actions that reach outside the server.',
      },
      {
        key: 'usage',
        label: 'Usage',
        icon: IconGauge,
        desc: 'What today cost, and the stop that keeps it honest.',
      },
    ],
  },
  {
    label: 'Server',
    sections: [
      {
        key: 'server',
        label: 'Sign-up',
        icon: IconServer,
        desc: 'How this server lets people in. Only its app admins see this.',
      },
    ],
  },
]

export const SETTINGS_TAB_KEYS = [
  'profile',
  'preferences',
  'general',
  'people',
  'storage',
  'emojis',
  'themes',
  'models',
  'outside',
  'usage',
  'server',
] as const satisfies readonly SettingsTab[]

export const THEME_OPTIONS = [
  { id: 'light', label: 'Light', desc: 'Paper' },
  { id: 'dark', label: 'Dark', desc: 'Ink' },
] as const

/** Tabs only an app admin sees. */
export const ADMIN_TABS: ReadonlySet<string> = new Set(['server'])

export const SIGNUP_OPTIONS: readonly Option<SignupMode>[] = [
  {
    id: 'invite',
    label: 'Invite only',
    desc: 'Only an email a workspace has invited can create an account.',
  },
  {
    id: 'open',
    label: 'Anyone',
    desc: 'Anyone who reaches this server can create an account and workspaces.',
  },
]

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
    { id: 'claude-sonnet-5-5', desc: 'Balanced — reads what it needs, writes well' },
    { id: 'claude-opus-5-5', desc: 'Deepest — plans and checks, slower' },
    { id: 'claude-haiku-5-5', desc: 'Fastest — short answers, cheapest' },
  ],
  openrouter: [
    { id: 'anthropic/claude-sonnet-5.5', desc: 'Balanced — reads what it needs, writes well' },
    { id: 'anthropic/claude-opus-5.5', desc: 'Deepest — plans and checks, slower' },
    { id: 'anthropic/claude-haiku-5.5', desc: 'Fastest — short answers, cheapest' },
  ],
}

export const MODEL_MENU_LIMIT = 60
