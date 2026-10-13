import { INVITE_PARAM } from '@/lib/constants'

/** The link is the invitation: only the invited email can accept it, so it is safe to paste. */
export function inviteLink(invitationId: string): string {
  const url = new URL(window.location.origin)
  url.searchParams.set(INVITE_PARAM, invitationId)
  return url.toString()
}
