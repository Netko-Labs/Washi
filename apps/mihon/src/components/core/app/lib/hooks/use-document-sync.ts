import { paperRegistry } from '@washi/paper/registry'
import { useEffect } from 'react'
import { useBookStore } from '@/components/shared/book'

function hashName(): string {
  try {
    return decodeURIComponent(window.location.hash.slice(1))
  } catch {
    return ''
  }
}

/** The document follows the book (`.dark`, `#Name`, the title) and the hash picks back. */
export function useDocumentSync(): void {
  const mode = useBookStore((state) => state.mode)
  const primitive = useBookStore((state) => state.primitive)

  useEffect(() => {
    const follow = () => {
      const name = hashName()
      if (name && name in paperRegistry.components && name !== useBookStore.getState().primitive) {
        useBookStore.getState().pick(name)
      }
    }
    follow()
    window.addEventListener('hashchange', follow)
    return () => window.removeEventListener('hashchange', follow)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }, [mode])

  useEffect(() => {
    window.history.replaceState(null, '', `#${primitive}`)
    document.title = `${primitive} · Mihon`
  }, [primitive])
}
