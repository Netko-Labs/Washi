import { IconInbox } from '@tabler/icons-react'
import type { ShareToggleProps } from './lib'
import { ShareSwitch } from './share-switch'

/** D120: a public page's adds may reach the Inbox as suggestions; off, the link adds nothing. */
export function ShareSuggest(props: ShareToggleProps) {
  return (
    <ShareSwitch
      {...props}
      icon={IconInbox}
      label="Visitors can suggest rows"
      detail="The page's forms, calendars and boards take the visitor's name; each row waits on the page and in the Inbox until a member approves it. Redacted columns stay unreadable."
    />
  )
}
