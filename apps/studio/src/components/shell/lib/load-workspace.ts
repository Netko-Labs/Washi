import { redirect } from '@tanstack/react-router'
import { readSession } from '@/integrations/auth'
import { api } from '@/integrations/trpc'
import { enterWorkspace } from './enter-workspace'

/** Signed out goes to sign-in and comes back here; signed in but not a member goes to the picker. */
export async function loadWorkspace(workspaceId: string, href: string) {
  const session = await readSession()
  if (!session) throw redirect({ to: '/sign-in', search: { redirect: href } })
  const workspaces = await api.workspaces.list.query()
  const workspace = workspaces.find((entry) => entry.id === workspaceId)
  if (!workspace) throw redirect({ to: '/workspaces', search: {} })
  enterWorkspace(workspace)
  return { workspace, workspaces }
}
