import { useCallback, useEffect, useState } from 'react'
import { auth } from '@/integrations/auth'
import type { InvitationView, MemberView } from '../types'

/** Members and pending invitations are Better Auth's — a workspace is an organization. */
export function usePeople(workspaceId: string) {
  const [members, setMembers] = useState<MemberView[]>([])
  const [invitations, setInvitations] = useState<InvitationView[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const result = await auth.organization.getFullOrganization({
      query: { organizationId: workspaceId },
    })
    if (result.error) {
      setError(result.error.message ?? 'Could not load the people in this workspace.')
      return
    }
    setMembers(
      (result.data?.members ?? []).map((member) => ({
        id: member.id,
        role: member.role,
        name: member.user.name,
        email: member.user.email,
      })),
    )
    setInvitations(
      (result.data?.invitations ?? [])
        .filter((invitation) => invitation.status === 'pending')
        .map((invitation) => ({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: new Date(invitation.expiresAt).toISOString(),
        })),
    )
  }, [workspaceId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const invite = async (email: string, role: 'member' | 'admin') => {
    setError(null)
    const result = await auth.organization.inviteMember({
      email,
      role,
      organizationId: workspaceId,
    })
    if (result.error) {
      setError(result.error.message ?? 'Could not invite that person.')
      return null
    }
    await refresh()
    return result.data?.id ?? null
  }

  const cancel = async (invitationId: string) => {
    await auth.organization.cancelInvitation({ invitationId })
    await refresh()
  }

  return { members, invitations, error, invite, cancel }
}
