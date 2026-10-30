import type { UnsplashPhotoRow } from '@washi/domain'
import type { UnsplashCredit } from '@washi/paper'

export interface UnsplashState {
  photos: UnsplashPhotoRow[]
  refresh: () => Promise<void>
  reset: () => void
  /** What a page wearing `unsplash:<id>` draws and credits; undefined until the photo is kept. */
  creditOf: (id: string) => UnsplashCredit | undefined
}
