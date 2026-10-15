import { create } from 'zustand'
import { api } from '../../api'
import { useSheetsStore } from '../sheets/sheets-store'
import type { LiveState } from './types'

let subscription: { unsubscribe: () => void } | null = null
let pageTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()

/** A burst of writes (Washi saving page after page) refreshes the list once. */
const PAGE_REFRESH_MS = 150

/** What moved: the page list refreshes (and with it the open page); data listeners refetch. */
export const useLiveStore = create<LiveState>(() => ({
  connect: () => {
    if (subscription) return
    subscription = api.live.onChange.subscribe(undefined, {
      onData: ({ data }) => {
        if (data.kind === 'data') {
          for (const listener of listeners) listener()
          return
        }
        if (pageTimer) clearTimeout(pageTimer)
        pageTimer = setTimeout(() => void useSheetsStore.getState().refresh(), PAGE_REFRESH_MS)
      },
    })
  },
  disconnect: () => {
    subscription?.unsubscribe()
    subscription = null
    if (pageTimer) clearTimeout(pageTimer)
  },
  onData: (listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}))
