import { useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { focusMain, holdsFocus } from '../utils'

/** After a move to another address (never the first load), focus starts at the page, not the link pressed. */
export function useMainOnNavigate() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const last = useRef(pathname)

  useEffect(() => {
    if (last.current === pathname) return
    last.current = pathname
    if (!holdsFocus(document.activeElement)) focusMain()
  }, [pathname])
}
