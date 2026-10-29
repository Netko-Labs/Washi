import { useEffect } from 'react'

export function useFabShortcut(togglePanel: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'j' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        togglePanel()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [togglePanel])
}
