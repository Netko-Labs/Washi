import { parse } from '@washi/wsx'
import { useEffect, useState } from 'react'
import { APP_NAME } from '@/components/core/root'
import { useDocumentTitle } from '@/components/shared/document-title'
import type { SharedPayload, SharedState } from '../types'
import { fetchShared } from '../utils'

export function useSharedPage(workspaceId: string, token: string): SharedState {
  const [state, setState] = useState<SharedState>({ status: 'loading' })
  useEffect(() => {
    let live = true
    fetchShared(workspaceId, token)
      .then((page: SharedPayload | null) => {
        if (!live) return
        setState(page ? { status: 'ready', page, root: parse(page.source) } : { status: 'gone' })
      })
      .catch(() => live && setState({ status: 'gone' }))
    return () => {
      live = false
    }
  }, [workspaceId, token])
  useDocumentTitle(state.status === 'ready' ? [state.page.title, APP_NAME] : [])
  return state
}
