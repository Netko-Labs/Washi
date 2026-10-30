import type { CodeLimit, CodeLimits, Safeguard, SafeguardSubject, Safeguards } from '@washi/domain'
import type { ModelOption } from '@/lib/types'
import type { ApprovalMode, KeyState, ProviderId, SignupMode } from '../../lib'

/** What a new workspace starts with; an unset field keeps Washi's own. */
export interface WorkspaceDefaultsState {
  approvalMode?: ApprovalMode
  dailyCapUsd?: number
  turnCap?: number
}

/** The server's Exa or Unsplash key as its admins see it: only the last four. */
export interface ServerSearchKeyState {
  last4: string
  updatedAt: string
  updatedBy: string | null
}

/** A page package's row (D116), as the server's installer reports it. */
export interface PagePackageState {
  name: string
  spec: string
  version: string | null
  status: 'installing' | 'ready' | 'failed'
  bytes: number | null
  error: string | null
}

export interface ServerSettingsState {
  signup: SignupMode
  key: KeyState | null
  searchKey: ServerSearchKeyState | null
  unsplashKey: ServerSearchKeyState | null
  fetchHosts: string[]
  embedHosts: string[]
  widgetHosts: string[]
  widgets: boolean
  defaults: WorkspaceDefaultsState
  pagePackages: PagePackageState[]
  safeguards: Safeguards
  limits: CodeLimits
  safeguardLog: SafeguardChangeState[]
}

/** The newest change to one safeguard, as the trail tells it. */
export interface SafeguardChangeState {
  which: SafeguardSubject
  on: boolean
  by: string | null
  at: string
}

export type HostListKind = 'fetch' | 'embed' | 'widget' | 'workspaceWidget'

export interface LentKeyCopy {
  title: string
  desc: string
  lent: string
  none: string
  blurb: string
}

export interface HostListCopy {
  title: string
  desc: string
  placeholder: string
  empty: string
  /** What `*` in this list lets happen, said plainly beside its shortcut. */
  anyWarning: string
}

export interface SafeguardCopy {
  label: string
  /** What lifting it lets happen. */
  warning: string
}

export interface LimitRow {
  limit: CodeLimit
  label: string
  unit: string
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

export type LentKeyTarget = 'exa' | 'unsplash'

export interface ServerLentKeyCardProps {
  target: LentKeyTarget
  connected: ServerSearchKeyState | null
  /** Null when it took; otherwise the server's refusal. */
  onSave: (key: string) => Promise<string | null>
  onRemove: () => Promise<unknown>
}

export interface HostListCardProps {
  kind: HostListKind
  hosts: string[]
  /** Null when it took; otherwise the refusal, in words. */
  onSave: (hosts: string[]) => Promise<string | null>
  /** Off, the list is only read: a member's view of a steward's list. */
  isEditable?: boolean
  /** When `*` last came or went. */
  lastChange?: SafeguardChangeState
}

export interface SafeguardsCardProps {
  safeguards: Safeguards
  log: SafeguardChangeState[]
  onChange: (which: Safeguard, on: boolean) => Promise<unknown>
}

export interface CodeLimitsCardProps {
  limits: CodeLimits
  lastChange?: SafeguardChangeState
  onSave: (limits: CodeLimits) => Promise<unknown>
}

export interface ServerWidgetsCardProps {
  widgets: boolean
  onChange: (enabled: boolean) => Promise<unknown>
}

export interface WorkspaceDefaultsCardProps {
  defaults: WorkspaceDefaultsState
  onSave: (defaults: WorkspaceDefaultsState) => Promise<unknown>
}

export interface PagePackagesCardProps {
  packages: PagePackageState[]
  /** Null when it was listed; otherwise the refusal, in words. */
  onAdd: (spec: string) => Promise<string | null>
  onRemove: (name: string) => Promise<unknown>
}
