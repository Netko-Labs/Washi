import { useSyncExternalStore } from 'react'
import { NARROW_QUERY } from '../constants'

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(NARROW_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

const read = () => window.matchMedia(NARROW_QUERY).matches

/** `matchMedia` lives on `window` only. Client-only: the workspace routes never SSR. */
export function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribe, read, () => false)
}
