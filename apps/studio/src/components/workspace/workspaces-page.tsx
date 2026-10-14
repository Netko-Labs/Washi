import { getRouteApi, Navigate, useNavigate } from '@tanstack/react-router'
import { useSession } from '@/integrations/auth'
import { inviteReturn } from './lib'
import { WorkspacePicker } from './workspace-picker'

const route = getRouteApi('/workspaces')

export function WorkspacesPage() {
  const { invite } = route.useSearch()
  const { data: session, isPending } = useSession()
  const navigate = useNavigate()
  if (isPending) return null
  if (!session) return <Navigate to="/sign-in" search={{ redirect: inviteReturn(invite) }} />
  return (
    <WorkspacePicker
      onOpen={(workspaceId) => void navigate({ to: '/w/$workspaceId', params: { workspaceId } })}
    />
  )
}
