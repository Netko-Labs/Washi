import { useState } from 'react'

export function useDarkTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const setTheme = (next: boolean) => {
    document.documentElement.classList.toggle('dark', next)
    setDark(next)
  }
  return { dark, setTheme }
}
