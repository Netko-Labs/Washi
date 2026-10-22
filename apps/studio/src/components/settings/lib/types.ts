import type { Icon } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import type { ModelOption } from '@/lib/types'

export type ProviderId = 'anthropic' | 'openrouter'
export type KeyTarget = ProviderId | 'exa'
export type Effort = 'quick' | 'balanced' | 'deep'
export type ResumeBy = 'anyone' | 'owners'
export type ApprovalMode = 'ask' | 'auto'
export type SettingsTab = 'agent' | 'people' | 'routines'

export interface KeyState {
  last4: string
  provider: string
  model: string | null
  updatedAt: string
  updatedBy: string | null
}

export interface SearchKeyState {
  last4: string
  updatedAt: string
}

export interface SpendState {
  day: string
  costUsd: number
  savedUsd: number
  turns: number
  capUsd: number
  turnCap: number
  paused: boolean
}

export interface AgentSettingsState {
  capUsd: number
  turnCap: number
  resumeBy: ResumeBy
  effort: Effort
  zone: string
}

export interface KeyInput {
  key: string
  provider: string
  model: string | null
}

export interface KeyFormProps {
  models: ModelOption[]
  catalogueSource: string | null
  hasKey: boolean
  onSave: (input: KeyInput) => Promise<boolean>
  /** Fields that save with the key, rendered above its button. */
  extra?: ReactNode
}

export interface SettingsScreenProps {
  workspaceId: string
  tab: SettingsTab
  onTab: (tab: SettingsTab) => void
}

export interface ProviderMeta {
  id: KeyTarget
  label: string
  /** The letters on the tile and its colours. */
  mark: string
  tint: string
  hint: string
  from: string
  blurb: string
}

export interface Option<T extends string> {
  id: T
  label: string
  desc: string
}

export interface RecommendedModel {
  id: string
  desc: string
}

export interface SettingsCardProps {
  title: string
  desc: string
  tag?: { label: string; tone: 'ok' | 'off' }
  children: ReactNode
}

export interface SettingRowProps {
  label: string
  hint?: string
  icon?: Icon
  children: ReactNode
}

export interface SegmentedProps<T extends string> {
  value: T
  options: readonly Option<T>[]
  onChange: (value: T) => void
  /** The description of the chosen option, shown under the row. */
  describe?: boolean
}

export interface ProviderRowProps {
  meta: ProviderMeta
  connected: { last4: string; updatedAt: string; updatedBy?: string | null } | null
  onConnect: () => void
  onRemove: () => void
}

export interface ModelCardProps {
  providerKey: KeyState | null
  models: ModelOption[]
  catalogueSource: string | null
  effort: Effort
  onConnect: (target: ProviderId) => void
  onRemove: () => Promise<unknown>
  onModel: (model: string | null) => Promise<unknown>
  onEffort: (effort: Effort) => Promise<unknown>
}

export interface ModelMenuProps {
  models: ModelOption[]
  provider: string
  value: string | null
  catalogueSource: string | null
  onPick: (id: string | null) => void
}

export interface OutsideCardProps {
  approvalMode: ApprovalMode
  searchKey: SearchKeyState | null
  onApprovalMode: (mode: ApprovalMode) => Promise<unknown>
  onConnect: () => void
  onRemove: () => Promise<unknown>
}

export interface UsageCardProps {
  spend: SpendState
  settings: AgentSettingsState
  onDailyCap: (capUsd: number) => Promise<unknown>
  onTurnCap: (turnCap: number) => Promise<unknown>
  onResumeBy: (resumeBy: ResumeBy) => Promise<unknown>
  onPause: () => Promise<unknown>
  onResume: () => Promise<unknown>
}

export interface GaugeProps {
  value: number
  max: number
  big: string
  of: string
  left: string
  right: string
  tone: 'spend' | 'turns'
}

export interface NumberRowProps {
  label: string
  hint?: string
  value: number
  prefix?: string
  integer?: boolean
  onSave: (value: number) => Promise<unknown>
}

export interface KeyDialogProps {
  target: KeyTarget
  connected: { last4: string; updatedAt: string; updatedBy?: string | null } | null
  onSave: (key: string) => Promise<boolean>
  onRemove: () => Promise<unknown>
  onClose: () => void
  /** The reason the last save failed, from the hook that owns the request. */
  error: string | null
}
