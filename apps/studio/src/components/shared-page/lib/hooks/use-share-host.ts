import { getRouteApi } from '@tanstack/react-router'
import type { PaperHost } from '@washi/paper'
import { useMemo } from 'react'
import type { SharedPayload } from '../types'
import { shareHost } from '../utils'

const sharedRoute = getRouteApi('/s/$workspaceId/$token')

/** The link's host for the page drawn, and how a press opens another of its pages (D123). */
export function useShareHost(
  workspaceId: string,
  token: string,
  page: SharedPayload | null,
): { host: PaperHost; open: (page: string | undefined) => void } {
  const navigate = sharedRoute.useNavigate()
  return useMemo(() => {
    const open = (next: string | undefined) => {
      void navigate({ search: { page: next } })
      window.scrollTo({ top: 0 })
    }
    const host = shareHost(workspaceId, token, {
      embedsAnySite: page?.embedsAnySite ?? false,
      suggest: page?.suggest ?? false,
      page: page && page.id !== page.home.id ? page.id : undefined,
      home: page?.home ?? null,
      pages: page?.pages ?? [],
      open,
    })
    return { host, open }
  }, [workspaceId, token, page, navigate])
}
