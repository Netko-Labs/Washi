import { Navigate, useNavigate } from '@tanstack/react-router'
import { useSession } from '@/integrations/auth'
import { WorkspacePicker } from './workspace-picker'

export function WorkspacesPage() {
  const { data: session, isPending } = useSession()
  const navigate = useNavigate()
  if (isPending) return null
  if (!session) return <Navigate to="/sign-in" search={{ redirect: '/workspaces' }} />
  return (
    <WorkspacePicker
      onOpen={(workspaceId) => void navigate({ to: '/w/$workspaceId', params: { workspaceId } })}
    />
  )
}
