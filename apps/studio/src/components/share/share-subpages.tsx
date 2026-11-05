import { IconSitemap } from '@tabler/icons-react'
import type { ShareToggleProps } from './lib'
import { ShareSwitch } from './share-switch'

/** D123: a public page's link may open its sub-pages too, so the page works as a home for them. */
export function ShareSubpages(props: ShareToggleProps) {
  return (
    <ShareSwitch
      {...props}
      icon={IconSitemap}
      label="Include sub-pages"
      detail="Visitors can open the pages under this one from its links and sub-page lists, each read-only with its own redactions. Private pages stay off the link."
    />
  )
}
