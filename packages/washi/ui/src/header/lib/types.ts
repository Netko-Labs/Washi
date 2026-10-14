import type { ReactNode } from 'react'

export interface HeaderProps {
  /** Before the breadcrumb — the web's drawer button. */
  leading?: ReactNode
  /** The host's own buttons on the right: Copy link on the web, Share on the desktop. */
  actions?: ReactNode
}
