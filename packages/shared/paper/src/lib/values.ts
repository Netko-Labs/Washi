import type { Tone } from './types'

/** Words that carry meaning wear its tone wherever they show — a badge, a pill, a card. */
export const VALUE_TONES: Record<string, Tone> = {
  critical: 'danger',
  urgent: 'danger',
  highest: 'danger',
  high: 'danger',
  blocked: 'danger',
  bug: 'danger',
  medium: 'warning',
  review: 'warning',
  'in review': 'warning',
  low: 'neutral',
  todo: 'neutral',
  backlog: 'neutral',
  cancelled: 'neutral',
  doing: 'info',
  'in progress': 'info',
  active: 'info',
  task: 'info',
  done: 'success',
  complete: 'success',
  shipped: 'success',
  story: 'success',
  epic: 'accent',
}
