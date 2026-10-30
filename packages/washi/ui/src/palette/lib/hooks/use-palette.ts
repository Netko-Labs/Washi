import { useEffect, useRef } from 'react'
import { useDialogFocus } from '../../../focus'
import { useSheetsStore } from '../../../stores'

/** ⌘K opens it, Escape closes it, and while open it is a modal: focus in, trapped, then back. */
export function usePalette(isOpen: boolean) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        useSheetsStore.getState().openPalette()
      }
      if (event.key === 'Escape') useSheetsStore.getState().closePalette()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useDialogFocus(ref, isOpen, { trap: true })
  return ref
}
