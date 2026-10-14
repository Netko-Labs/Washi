import { useEffect, useState } from 'react'
import { THEME_KEY } from '../constants'
import type { Theme } from '../types'

function storedTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Paper by default; the dark tokens were always there, now something can reach them. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(storedTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // private mode: the choice lasts the visit
    }
  }, [theme])

  return { theme, toggle: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')) }
}
