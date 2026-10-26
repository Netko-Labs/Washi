import { VAULT_TOPIC_ORDER } from '@washi/ui'
import { auth } from '@/integrations/auth'
import { INVITE_PARAM } from '@/lib/constants'
import type { CreateResult } from './types'

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

/** A workspace is an organization; its slug only has to be unique, never read. */
export async function createWorkspace(name: string): Promise<CreateResult> {
  const slug = `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}-${Date.now().toString(36)}`
  try {
    const result = await auth.organization.create({ name, slug })
    if (result.error || !result.data) {
      return { error: result.error?.message ?? 'Could not create that workspace.' }
    }
    return { id: result.data.id }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : String(cause) }
  }
}
