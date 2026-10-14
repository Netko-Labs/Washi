import { VAULT_TOPIC_ORDER } from '@washi/ui'
import { INVITE_PARAM } from '@/lib/constants'

/** Where sign-in hands back to: the picker, still holding the invitation it was sent for. */
export function inviteReturn(invite: string | null | undefined): string {
  return invite ? `/workspaces?${INVITE_PARAM}=${encodeURIComponent(invite)}` : '/workspaces'
}

/** A stable mascot per workspace, so two of them never look alike at a glance. */
export function topicFor(workspaceId: string): string {
  let hash = 0
  for (const char of workspaceId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return VAULT_TOPIC_ORDER[hash % VAULT_TOPIC_ORDER.length] ?? 'plain'
}
