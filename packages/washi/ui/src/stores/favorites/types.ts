export interface FavoritesState {
  workspaceKey: string | null
  ids: string[]
  /** The host names the workspace once it is entered; favorites are per person, per workspace. */
  bind: (workspaceKey: string) => void
  toggle: (sheetId: string) => void
}
