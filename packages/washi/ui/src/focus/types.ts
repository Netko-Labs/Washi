import type { RefObject } from 'react'

export interface DialogFocusOptions {
  /** Tab and Shift+Tab go around inside instead of leaving: a modal's rule. */
  trap?: boolean
  /** Where focus goes back on close; else whatever held it on open. */
  returnTo?: RefObject<HTMLElement | null>
}
