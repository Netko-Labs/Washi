import { useEffect } from 'react'
import { reloadForNewBuild } from '../utils'

/**
 * Vite's `vite:preloadError` fires on `window` when a lazy chunk is gone mid-rollout: reload once
 * into the new build. A second miss inside the window is left to throw, so the root error
 * boundary says Washi was updated instead of reloading forever.
 */
export function useReloadOnStaleBuild(): void {
  useEffect(() => {
    const onPreloadError = (event: Event) => {
      if (reloadForNewBuild()) event.preventDefault()
    }
    window.addEventListener('vite:preloadError', onPreloadError)
    return () => window.removeEventListener('vite:preloadError', onPreloadError)
  }, [])
}
