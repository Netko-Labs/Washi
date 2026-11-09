import { IconMail } from '@tabler/icons-react'
import type { ShareToggleProps } from './lib'
import { ShareSwitch } from './share-switch'

/** D131: a visitor's suggestion asks their email too, or only their name. */
export function ShareSuggestEmail(props: ShareToggleProps) {
  return (
    <ShareSwitch
      {...props}
      icon={IconMail}
      label="Ask for their email"
      detail="Off, visitors give only their name. Either way, who asked stays with the row once you approve it."
    />
  )
}
