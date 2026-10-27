import { useRouter, useRouterState } from '@tanstack/react-router'
import { useRowOpenerStore } from '@washi/ui'
import { useEffect } from 'react'
import type { Peek } from '../types'
import { peekOf, withPeek } from '../utils'

/** The peeked row is the address (`?peek=<page>`): Back closes it, a link reopens it (D58). */
export function usePeek(workspaceId: string): Peek {
  const router = useRouter()
  const sheetId = useRouterState({ select: (state) => peekOf(state.location.searchStr) })

  useEffect(
    () =>
      useRowOpenerStore
        .getState()
        .register((id) => router.history.push(withPeek(router.state.location, id))),
    [router],
  )

  return {
    sheetId,
    close: () => router.history.push(withPeek(router.state.location, null)),
    expand: () => {
      if (sheetId) router.history.push(`/w/${workspaceId}/p/${sheetId}`)
    },
  }
}
