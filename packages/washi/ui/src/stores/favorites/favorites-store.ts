import { create } from 'zustand'
import { KEY_PREFIX } from './constants'
import type { FavoritesState } from './types'

function read(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY_PREFIX + key) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function write(key: string, ids: string[]): void {
  try {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(ids))
  } catch {
    // private mode: favorites last the visit
  }
}

/** Browser storage, not the workspace file: a favorite is one person's shortcut, not team data. */
export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  workspaceKey: null,
  ids: [],
  bind: (workspaceKey) => set({ workspaceKey, ids: read(workspaceKey) }),
  toggle: (sheetId) => {
    const { workspaceKey, ids } = get()
    const next = ids.includes(sheetId) ? ids.filter((id) => id !== sheetId) : [...ids, sheetId]
    set({ ids: next })
    if (workspaceKey) write(workspaceKey, next)
  },
}))
