import { IconWorld } from '@tabler/icons-react'
import { relativeTime } from '@washi/ui'
import { type RowGuestProps, useRowGuest } from './lib'

/**
 * A row a visitor asked for through a page's link keeps who they were (D131): their name, and their
 * email where the page asked one and the reader reads that page. A member's own row draws nothing.
 */
export function RowGuest({ recordId }: RowGuestProps) {
  const guest = useRowGuest(recordId)
  if (!guest) return null
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-muted-foreground">
      <IconWorld className="size-3.5 shrink-0" />
      <span>
        Asked for by <span className="font-semibold text-foreground">{guest.name}</span> through the
        shared link · {relativeTime(guest.hlcAsked)}
      </span>
      {guest.email && (
        <a className="underline underline-offset-2" href={`mailto:${guest.email}`}>
          {guest.email}
        </a>
      )}
    </p>
  )
}
