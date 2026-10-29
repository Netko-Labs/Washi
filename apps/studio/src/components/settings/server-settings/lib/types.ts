import type { ModelOption } from '@/lib/types'
import type { ApprovalMode, KeyState, ProviderId, SignupMode } from '../../lib'

/** What a new workspace starts with; an unset field keeps Washi's own. */
export interface WorkspaceDefaultsState {
  approvalMode?: ApprovalMode
  dailyCapUsd?: number
  turnCap?: number
}

export interface ServerSettingsState {
  signup: SignupMode
  key: KeyState | null
  fetchHosts: string[]
  embedHosts: string[]
  widgets: boolean
  defaults: WorkspaceDefaultsState
}

export type HostListKind = 'fetch' | 'embed'

export interface HostListCopy {
  title: string
  desc: string
  placeholder: string
  empty: string
}

export interface ServerKeyCardProps {
  serverKey: KeyState | null
  models: ModelOption[]
  catalogueSource: string | null
  /** Null when it took; otherwise the server's refusal. */
  onSave: (provider: ProviderId, key: string) => Promise<string | null>
  onRemove: () => Promise<unknown>
  onModel: (model: string | null) => Promise<unknown>
}

export interface HostListCardProps {
  kind: HostListKind
  hosts: string[]
  /** Null when it took; otherwise the refusal, in words. */
  onSave: (hosts: string[]) => Promise<string | null>
}

export interface ServerWidgetsCardProps {
  widgets: boolean
  onChange: (enabled: boolean) => Promise<unknown>
}

export interface WorkspaceDefaultsCardProps {
  defaults: WorkspaceDefaultsState
  onSave: (defaults: WorkspaceDefaultsState) => Promise<unknown>
}
