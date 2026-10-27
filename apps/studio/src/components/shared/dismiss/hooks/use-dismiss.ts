import { type RefObject, useEffect } from 'react'

/**
 * Closes on a press outside `ref` or on Escape; listens only while open. A press inside a
 * `Floating` counts as inside: it is the menu's own popover, drawn on the body.
 */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!isOpen) return
    const press = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      if (ref.current?.contains(event.target) || event.target.closest('[data-floating]')) return
      onDismiss()
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }
    document.addEventListener('pointerdown', press)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', press)
      document.removeEventListener('keydown', key)
    }
  }, [ref, isOpen, onDismiss])
}
