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
  widgets: boolean
  defaults: WorkspaceDefaultsState
  pagePackages: PagePackageState[]
}

export type HostListKind = 'fetch' | 'embed'

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
