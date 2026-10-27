import { useEffect, useRef } from 'react'
import { isOwnedEscape } from '../utils'

/** Escape closes the peek, after any field or menu inside it has had the key. */
export function usePeekEscape(isOpen: boolean, close: () => void): void {
  const latest = useRef(close)
  latest.current = close

  useEffect(() => {
    if (!isOpen) return
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isOwnedEscape(event)) latest.current()
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [isOpen])
}
