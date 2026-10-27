import type { ReactNode } from 'react'

export interface HeaderProps {
  /** Before the breadcrumb — the web's drawer button. */
  leading?: ReactNode
  /** The host's own buttons on the right: Copy link on the web, Share on the desktop. */
  actions?: ReactNode
  /** The host's actions hold the star (a phone's ⋯), so the crumbs leave it out. */
  starInActions?: boolean
}

export interface HeaderCrumbsProps {
  starInActions?: boolean
}
