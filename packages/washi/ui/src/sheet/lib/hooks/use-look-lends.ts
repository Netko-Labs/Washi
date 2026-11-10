import type { SheetDetail } from '@washi/domain'
import type { SheetLookHost } from '@washi/paper'
import { useWorkspaceLookStore } from '../../../stores/look/look-store'
import { useThemesStore } from '../../../stores/themes/themes-store'
import { useUnsplashStore } from '../../../stores/unsplash/unsplash-store'

/**
 * What the workspace lends a page's look: its own themes, the Unsplash photos it keeps, and the
 * icon and cover a page with none of its own wears (D139) — a row's page keeps its plain frame.
 */
export function useLookLends(
  sheet: SheetDetail | null,
): Pick<SheetLookHost, 'theme' | 'unsplash' | 'defaults'> {
  const themes = useThemesStore((store) => store.themes)
  const photos = useUnsplashStore((store) => store.photos)
  const icon = useWorkspaceLookStore((store) => store.icon)
  const cover = useWorkspaceLookStore((store) => store.cover)
  const isRow = Boolean(sheet?.rowOf)
  return {
    theme: themes.length > 0 ? useThemesStore.getState().pairOf : undefined,
    unsplash: photos.length > 0 ? useUnsplashStore.getState().creditOf : undefined,
    defaults: isRow ? undefined : { icon: icon ?? undefined, cover: cover ?? undefined },
  }
}
