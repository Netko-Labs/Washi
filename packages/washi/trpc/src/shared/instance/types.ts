import type {
  CodeLimits,
  PagePackage,
  Safeguard,
  SafeguardChange,
  ServerPolicy,
  WorkspaceDefaults,
} from '@washi/domain'
import type { AgentCredentialInput } from '../../init'
import type { SIGNUP_MODES } from './values'

export type SignupMode = (typeof SIGNUP_MODES)[number]

/** The server's own model key as its admins see it: never the key, only its last four. */
export interface ServerKeyInfo {
  last4: string
  provider: string
  model: string | null
  updatedAt: Date
  updatedBy: string | null
}

/** The server's own Exa key as its admins see it: never the key, only its last four. */
export interface ServerSearchKeyInfo {
  last4: string
  updatedAt: Date
  updatedBy: string | null
}

/** What a workspace without a key of its own runs on — for its members, not even the last four. */
export interface ServerKeyUse {
  provider: string
  model: string | null
}

/** The last time a safeguard (or the limits) changed, its admin by name. */
export interface SafeguardChangeInfo {
  which: SafeguardChange['which']
  on: boolean
  by: string | null
  at: Date
}

/** The server's own settings, held by its app admins (its first account). Absent in embedded mode. */
export interface InstanceStore {
  isAdmin(actorId: string): Promise<boolean>
  signup(): Promise<SignupMode>
  setSignup(mode: SignupMode): Promise<void>
  /** Read from memory: every workspace check asks it, so it never waits on Postgres. */
  policy(): ServerPolicy
  /** A list that gains or loses `*` is logged like a safeguard (D118). */
  setFetchHosts(actorId: string, hosts: string[]): Promise<void>
  setEmbedHosts(actorId: string, hosts: string[]): Promise<void>
  /** Hosts a widget's frame may reach; empty is no network at all. */
  setWidgetHosts(actorId: string, hosts: string[]): Promise<void>
  setWidgets(enabled: boolean): Promise<void>
  setDefaults(defaults: WorkspaceDefaults): Promise<void>
  /** The admin's list as the installer keeps it (D116); only the runtime's installer writes it. */
  setPagePackages(packages: PagePackage[]): Promise<void>
  /** Every flip is logged: which, to what, by whom, when (D118). */
  setSafeguard(actorId: string, which: Safeguard, on: boolean): Promise<void>
  setLimits(actorId: string, limits: CodeLimits): Promise<void>
  /** The newest change per safeguard. */
  safeguardLog(): Promise<SafeguardChangeInfo[]>
  keyInfo(): Promise<ServerKeyInfo | null>
  setKey(actorId: string, credential: AgentCredentialInput): Promise<{ last4: string }>
  setKeyModel(actorId: string, model: string | null): Promise<void>
  /** Workspaces without a key of their own fall asleep. */
  removeKey(): Promise<void>
  searchKeyInfo(): Promise<ServerSearchKeyInfo | null>
  setSearchKey(actorId: string, key: string): Promise<{ last4: string }>
  /** Workspaces without an Exa key of their own lose web search. */
  removeSearchKey(): Promise<void>
  /** D117: the Unsplash Access Key a workspace without its own picks photos with. */
  unsplashKeyInfo(): Promise<ServerSearchKeyInfo | null>
  setUnsplashKey(actorId: string, key: string): Promise<{ last4: string }>
  removeUnsplashKey(): Promise<void>
}

/** A page package's row in Settings → Server: its install as it stands, in words when it failed. */
export interface PagePackageRow extends PagePackage {
  status: 'installing' | 'ready' | 'failed'
  /** The package's own folder, unpacked; its dependencies not counted. */
  bytes: number | null
  error: string | null
}

/** The server's page packages (D116), installed on the server by the runtime. Absent in embedded. */
export interface PagePackageStore {
  list(): PagePackageRow[]
  /** Listed at once; the install runs on and the row says how it went. */
  add(wanted: { name: string; spec: string }): Promise<PagePackageRow>
  remove(name: string): Promise<void>
}
