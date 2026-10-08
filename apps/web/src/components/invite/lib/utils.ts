import { INVITE_PARAM } from '@/lib/constants'

export function pendingInvite(): string | null {
  return new URLSearchParams(window.location.search).get(INVITE_PARAM)
}

/** Once answered, the link leaves the address bar so a reload does not ask again. */
export function clearInvite(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete(INVITE_PARAM)
  window.history.replaceState(null, '', url)
}
