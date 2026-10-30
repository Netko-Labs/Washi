import { type RefObject, useEffect, useRef } from 'react'

/**
 * A press outside the menu or Escape closes it. The menu sits beside its + in one wrapper,
 * so a press on the + is left to the +'s own toggle.
 */
export function useAttachDismiss(root: RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    const press = (event: PointerEvent) => {
      const wrapper = root.current?.parentElement
      if (event.target instanceof Node && wrapper?.contains(event.target)) return
      close.current()
    }
    const key = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      close.current()
    }
    document.addEventListener('pointerdown', press)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', press)
      document.removeEventListener('keydown', key)
    }
  }, [root])
}
