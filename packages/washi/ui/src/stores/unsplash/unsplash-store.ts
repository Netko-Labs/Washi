import { create } from 'zustand'
import { api } from '../../api'
import type { UnsplashState } from './types'

/** The Unsplash photos the workspace's pages picked (D117); the live feed refreshes them with the pages. */
export const useUnsplashStore = create<UnsplashState>((set, get) => ({
  photos: [],
  refresh: async () => {
    const photos = await api.unsplash.photos.query().catch(() => null)
    if (photos) set({ photos })
  },
  reset: () => set({ photos: [] }),
  creditOf: (id) => {
    const photo = get().photos.find((entry) => entry.id === id)
    return (
      photo && {
        url: photo.regularUrl,
        name: photo.photographer,
        profileUrl: photo.profileUrl,
        pageUrl: photo.pageUrl,
      }
    )
  },
}))
