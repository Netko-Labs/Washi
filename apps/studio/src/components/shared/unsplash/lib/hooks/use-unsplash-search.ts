import { useUnsplashStore } from '@washi/ui'
import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { KeptPhoto, UnsplashResult, UnsplashSearchState } from '../types'
import { messageOf } from '../utils'

const IDLE: UnsplashSearchState = {
  ready: null,
  photos: [],
  asked: null,
  page: 1,
  totalPages: 0,
  busy: false,
  picking: null,
  error: null,
}

/**
 * One search per press, never per keystroke: every call is a ledger row and Unsplash counts them
 * by the hour. A pick is read again on the server, kept, and counted as a download.
 */
export function useUnsplashSearch(onPicked: (photo: KeptPhoto) => void) {
  const [state, setState] = useState(IDLE)
  const patch = (next: Partial<UnsplashSearchState>) =>
    setState((current) => ({ ...current, ...next }))

  useEffect(() => {
    api.unsplash.status
      .query()
      .then(({ ready }) => setState((current) => ({ ...current, ready })))
      .catch(() => setState((current) => ({ ...current, ready: false })))
  }, [])

  const load = async (query: string, page: number, before: UnsplashResult[]) => {
    patch({ busy: true, error: null, asked: query })
    try {
      const found = await api.unsplash.search.mutate({ query, page })
      patch({
        busy: false,
        photos: [...before, ...found.photos],
        page,
        totalPages: found.totalPages,
      })
    } catch (cause) {
      patch({ busy: false, error: messageOf(cause) })
    }
  }

  return {
    ...state,
    search: (query: string) => (query.trim() ? load(query.trim(), 1, []) : undefined),
    more: () => (state.asked ? load(state.asked, state.page + 1, state.photos) : undefined),
    pick: async (photo: UnsplashResult) => {
      if (state.picking) return
      patch({ picking: photo.id, error: null })
      try {
        const kept = await api.unsplash.use.mutate({ id: photo.id })
        await useUnsplashStore.getState().refresh()
        patch({ picking: null })
        onPicked(kept)
      } catch (cause) {
        patch({ picking: null, error: messageOf(cause) })
      }
    },
  }
}
