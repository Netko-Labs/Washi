import { create } from 'zustand'
import { api } from '../../api'
import type { ThemesState } from './types'

/** The workspace's own page themes; the live feed refreshes them with the page list. */
export const useThemesStore = create<ThemesState>((set, get) => ({
  themes: [],
  refresh: async () => {
    const themes = await api.themes.list.query().catch(() => null)
    if (themes) set({ themes })
  },
  reset: () => set({ themes: [] }),
  pairOf: (key) => {
    const theme = get().themes.find((entry) => `ws:${entry.slug}` === key)
    return theme && { name: theme.name, light: theme.light, dark: theme.dark }
  },
}))
