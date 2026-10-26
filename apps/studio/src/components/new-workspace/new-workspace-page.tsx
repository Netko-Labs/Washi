import { Navigate } from '@tanstack/react-router'
import { useSession } from '@/integrations/auth'
import { NewWorkspace } from './new-workspace'

export function NewWorkspacePage() {
  const { data: session, isPending } = useSession()
  if (isPending) return null
  if (!session) return <Navigate to="/sign-in" search={{ redirect: '/new' }} />
  return <NewWorkspace />
}
