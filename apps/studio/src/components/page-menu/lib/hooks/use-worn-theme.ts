import { api } from '@washi/ui'
import { parse } from '@washi/wsx'
import { useEffect, useState } from 'react'

/** The theme the page's `<Sheet>` names now; null while it loads, `washi` when it names none. */
export function useWornTheme(id: string): string | null {
  const [theme, setTheme] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    api.sheets.get
      .query({ id })
      .then((sheet) => {
        if (!alive || !sheet) return
        const worn = parse(sheet.source).props.theme
        setTheme(typeof worn === 'string' ? worn : 'washi')
      })
      .catch(() => alive && setTheme('washi'))
    return () => {
      alive = false
    }
  }, [id])
  return theme
}
