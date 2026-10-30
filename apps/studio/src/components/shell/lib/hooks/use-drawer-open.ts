import { type RefObject, useEffect } from 'react'
import { DRAWER_CONTROLS, DRAWER_OPENER } from '../constants'
import { useShellStore } from '../shell-store'

/**
 * Whether the drawer is open. Opening it moves focus to its first control; Escape closes it and
 * puts focus back on ☰ — unless a menu or sheet over it is open: Escape is that one's first.
 */
export function useDrawerOpen(panel: RefObject<HTMLElement | null>): boolean {
  const isOpen = useShellStore((state) => state.drawer)

  useEffect(() => {
    if (!isOpen) return
    panel.current?.querySelector<HTMLElement>(DRAWER_CONTROLS)?.focus({ preventScroll: true })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      if (document.querySelector('[data-floating]')) return
      useShellStore.getState().setDrawer(false)
      document.querySelector<HTMLElement>(DRAWER_OPENER)?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, panel])

  return isOpen
}
