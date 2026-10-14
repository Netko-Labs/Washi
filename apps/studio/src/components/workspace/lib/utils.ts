import { INVITE_PARAM } from '@/lib/constants'

/** Where sign-in hands back to: the picker, still holding the invitation it was sent for. */
export function inviteReturn(invite: string | null | undefined): string {
  return invite ? `/workspaces?${INVITE_PARAM}=${encodeURIComponent(invite)}` : '/workspaces'
}
