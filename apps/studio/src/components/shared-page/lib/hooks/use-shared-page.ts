import { parse } from '@washi/wsx'
import { useEffect, useState } from 'react'
import { APP_NAME } from '@/components/core/root'
import { useDocumentTitle } from '@/components/shared/document-title'
import type { SharedPayload, SharedState } from '../types'
import { fetchShared } from '../utils'

/**
 * The link's page, or the sub-page it opens (D123). Moving between them keeps the page on screen
 * until the next one arrives, so a press never flashes an empty page.
 */
export function useSharedPage(workspaceId: string, token: string, page?: string): SharedState {
  const [state, setState] = useState<SharedState>({ status: 'loading' })
  useEffect(() => {
    let live = true
    fetchShared(workspaceId, token, page)
      .then((shared: SharedPayload | null) => {
        if (!live) return
        setState(
          shared
            ? { status: 'ready', page: shared, root: parse(shared.source) }
            : { status: 'gone' },
        )
      })
      .catch(() => live && setState({ status: 'gone' }))
    return () => {
      live = false
    }
  }, [workspaceId, token, page])
  const ready = state.status === 'ready' ? state.page : null
  useDocumentTitle(
    ready
      ? ready.id === ready.home.id
        ? [ready.title, APP_NAME]
        : [ready.title, ready.home.title, APP_NAME]
      : [],
  )
  return state
}
