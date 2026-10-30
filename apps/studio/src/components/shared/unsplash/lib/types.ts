import type { UnsplashPhotoRow } from '@washi/domain'
import type { RefObject } from 'react'

/** A search result as the picker draws it; the full shape is tsuru's `UnsplashPhoto`. */
export interface UnsplashResult {
  id: string
  alt: string | null
  color: string | null
  urls: { small: string }
  photographer: { name: string; profileUrl: string }
}

/** What a pick hands back: the photo as the workspace now keeps it. */
export type KeptPhoto = UnsplashPhotoRow & { alt: string | null }

export interface UnsplashSearchState {
  /** Null until the server says whether a key reaches Unsplash from here. */
  ready: boolean | null
  photos: UnsplashResult[]
  asked: string | null
  page: number
  totalPages: number
  busy: boolean
  picking: string | null
  error: string | null
}

export interface UnsplashPanelProps {
  onPicked: (photo: KeptPhoto) => void
}

export interface UnsplashTileProps {
  photo: UnsplashResult
  isPicking: boolean
  onPick: () => void
}

export interface UnsplashPickState {
  open: { anchor: RefObject<HTMLElement | null>; settle: (photo: KeptPhoto | null) => void } | null
  /** Opens the picker under `anchor`; settles with the kept photo, or null once dismissed. */
  ask: (anchor: HTMLElement) => Promise<KeptPhoto | null>
  dismiss: () => void
}
