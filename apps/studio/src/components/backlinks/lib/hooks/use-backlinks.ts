import type { SheetSummary } from '@washi/domain'
import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'

/** Pages that link here, refetched when this page or the page list changes. */
export function useBacklinks(pageId: string, version: string | undefined): SheetSummary[] {
  const [links, setLinks] = useState<{ pageId: string; pages: SheetSummary[] } | null>(null)

  useEffect(() => {
    let alive = true
    api.sheets.backlinks
      .query({ id: pageId })
      .then((pages) => alive && setLinks({ pageId, pages }))
      .catch(() => alive && setLinks({ pageId, pages: [] }))
    return () => {
      alive = false
    }
  }, [pageId, version])

  return links?.pageId === pageId ? links.pages : []
}
