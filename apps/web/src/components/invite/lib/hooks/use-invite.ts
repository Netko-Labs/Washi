import { useEffect, useState } from 'react'
import { auth } from '@/lib/auth'
import type { InviteState } from '../types'
import { clearInvite, pendingInvite } from '../utils'

/** Accept the invite in the URL once a session exists. Only its addressee can. */
export function useInvite(onAccepted: (workspaceId: string) => void): InviteState {
  const [state, setState] = useState<InviteState>(() =>
    pendingInvite() ? { kind: 'accepting' } : { kind: 'none' },
  )

  useEffect(() => {
    const invitationId = pendingInvite()
    if (!invitationId) return
    auth.organization
      .acceptInvitation({ invitationId })
      .then((result) => {
        clearInvite()
        const workspaceId = result.data?.invitation.organizationId
        if (workspaceId) {
          setState({ kind: 'none' })
          onAccepted(workspaceId)
          return
        }
        setState({
          kind: 'failed',
          message:
            result.error?.message ?? 'That invitation could not be accepted. Ask for a fresh link.',
        })
      })
      .catch(() =>
        setState({
          kind: 'failed',
          message: 'Could not reach the server to accept that invitation. Reload to try again.',
        }),
      )
  }, [onAccepted])

  return state
}
