import type { Tone } from '../../../lib/types'

/** Badge values that carry meaning get the tone for it; anything else stays neutral. */
export const BADGE_TONES: Record<string, Tone> = {
  highest: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
  bug: 'danger',
  story: 'success',
  task: 'info',
  epic: 'accent',
  blocked: 'danger',
}

export const SLIDE_MS = 180
export const SLIDE_EASING = 'cubic-bezier(0.2, 0, 0, 1)'
