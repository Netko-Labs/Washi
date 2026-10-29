export type AppView =
  | 'note'
  | 'dashboard'
  | 'inbox'
  | 'chats'
  | 'routines'
  | 'daily'
  | 'settings'
  | 'trash'
export type TabKey = `note:${string}` | `view:${Exclude<AppView, 'note'>}`

export interface Identity {
  name: string
  email: string
  color: string
}

export interface ViewState {
  tabs: TabKey[]
  activeTab: TabKey | null
  openTab: (key: TabKey) => void
  closeTab: (key: TabKey) => void
  closeAll: () => void
  /** Drag-to-reorder: `key` lands where `target` was. */
  moveTab: (key: TabKey, target: TabKey) => void
  /** A host restoring the strip it saved — the web keeps one per workspace. */
  setTabs: (tabs: TabKey[]) => void
  identity: Identity
  setIdentity: (patch: Partial<Identity>) => void
  workspaceName: string
  setWorkspaceName: (name: string) => void
}
