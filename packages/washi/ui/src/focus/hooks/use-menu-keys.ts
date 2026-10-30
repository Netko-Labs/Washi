import { type RefObject, useEffect } from 'react'
import { MENU_ITEM } from '../constants'
import { menuStep } from '../utils'

/**
 * Inside any `role="menu"` under `ref`: ↑ ↓ Home End walk its items, around at the ends. Tab is
 * `onTab`'s: a menu is one stop, and Tab leaves it.
 */
export function useMenuKeys(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onTab: () => void,
) {
  useEffect(() => {
    const root = ref.current
    if (!isOpen || !root) return
    const walk = (event: KeyboardEvent) => {
      if (!(event.target instanceof HTMLElement)) return
      const menu = event.target.closest('[role="menu"]')
      if (!menu || !root.contains(menu)) return
      if (event.key === 'Tab') {
        event.preventDefault()
        onTab()
        return
      }
      const items = [...menu.querySelectorAll<HTMLElement>(MENU_ITEM)]
      const target = menuStep(items.length, items.indexOf(event.target), event.key)
      if (target === null) return
      event.preventDefault()
      items[target]?.focus()
    }
    root.addEventListener('keydown', walk)
    return () => root.removeEventListener('keydown', walk)
  }, [ref, isOpen, onTab])
}
