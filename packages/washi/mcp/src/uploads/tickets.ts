import { processSingleton } from '@washi/domain'
import type { TicketAsk, UploadTicket } from './types'
import { MAX_TICKETS, TICKET_TTL_MS, TICKETS_KEY } from './values'

const tickets = () => processSingleton(TICKETS_KEY, () => new Map<string, UploadTicket>())

/** 32 random bytes as URL-safe base64: the whole of the permission, never stored elsewhere. */
const newToken = () => Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url')

function sweep(store: Map<string, UploadTicket>, now: number) {
  for (const [token, ticket] of store) if (ticket.expiresAt <= now) store.delete(token)
  // Maps keep insertion order: past the cap, the oldest tickets go first.
  for (const token of store.keys()) {
    if (store.size < MAX_TICKETS) break
    store.delete(token)
  }
}

/** A ticket for one upload, good once until it expires. */
export function issueTicket(ask: TicketAsk, now = Date.now()): UploadTicket {
  const store = tickets()
  sweep(store, now)
  const ticket: UploadTicket = {
    ...ask,
    token: newToken(),
    fileId: Bun.randomUUIDv7(),
    expiresAt: now + TICKET_TTL_MS,
  }
  store.set(ticket.token, ticket)
  return ticket
}

/** The ticket a token names, taken so it never works twice; null when unknown or expired. */
export function takeTicket(token: string, now = Date.now()): UploadTicket | null {
  const store = tickets()
  const ticket = store.get(token)
  if (!ticket) return null
  store.delete(token)
  return ticket.expiresAt > now ? ticket : null
}
