import type { PaperHost } from '@washi/paper'
import { createBookHost } from '@washi/paper/book'
import { useNoticeStore } from '@washi/ui'
import { useMemo } from 'react'

/** One in-memory workspace for every example: a `tasks` table, writes that land, nothing saved. */
export function useBookHost(): PaperHost {
  return useMemo(() => createBookHost((message) => useNoticeStore.getState().say(message)), [])
}
