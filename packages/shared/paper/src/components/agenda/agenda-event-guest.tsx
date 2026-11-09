import { type AgendaEventGuestProps, useRowGuest } from './lib'

/**
 * Who asked for the event through the page's link, kept once a member approved it (D131): their
 * name, and their email where the page asked one. A member's own event draws nothing.
 */
export function AgendaEventGuest({ id }: AgendaEventGuestProps) {
  const guest = useRowGuest(id)
  if (!guest) return null
  return (
    <p className="wsx-agenda-card-guest">
      <span>
        Booked by <strong>{guest.name}</strong> through the shared link
      </span>
      {guest.email && (
        <a className="wsx-link" href={`mailto:${guest.email}`}>
          {guest.email}
        </a>
      )}
    </p>
  )
}
