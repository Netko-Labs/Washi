import { useEffect } from 'react'
import { create } from 'zustand'
import { THEME_KEY } from '../constants'
import type { Theme, ThemeState } from '../types'

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  isHydrated: false,
  hydrate: () => {
    let theme: Theme = 'light'
    try {
      theme = localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
    } catch {
      // private mode: paper
    }
    apply(theme)
    set({ theme, isHydrated: true })
  },
  setTheme: (theme) => {
    apply(theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // private mode: the choice lasts the visit
    }
    set({ theme })
  },
}))

/** Paper or ink, one choice shared by every control that shows it (user menu, Preferences). */
export function useTheme() {
  const theme = useThemeStore((state) => state.theme)
  useEffect(() => {
    if (!useThemeStore.getState().isHydrated) useThemeStore.getState().hydrate()
  }, [])
  const setTheme = useThemeStore.getState().setTheme
  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }
}
