import { useEffect } from 'react'
import { create } from 'zustand'
import { DARK_QUERY, THEME_KEY } from '../constants'
import type { Theme, ThemeState } from '../types'
import { isDarkFor, isTheme } from '../utils'

function apply(theme: Theme) {
  const isDark = isDarkFor(theme, matchMedia(DARK_QUERY).matches)
  document.documentElement.classList.toggle('dark', isDark)
}

const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  isHydrated: false,
  hydrate: () => {
    let theme: Theme = 'light'
    try {
      const stored = localStorage.getItem(THEME_KEY)
      if (isTheme(stored)) theme = stored
    } catch {
      // private mode: paper
    }
    apply(theme)
    matchMedia(DARK_QUERY).addEventListener('change', () => {
      if (get().theme === 'system') apply('system')
    })
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

/** Paper, ink or the device's own, one choice shared by every control that shows it. */
export function useTheme() {
  const theme = useThemeStore((state) => state.theme)
  useEffect(() => {
    if (!useThemeStore.getState().isHydrated) useThemeStore.getState().hydrate()
  }, [])
  return { theme, setTheme: useThemeStore.getState().setTheme }
}
