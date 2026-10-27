import { useRouter } from '@tanstack/react-router'
import { auth } from '@/integrations/auth'
import { useNameDraft } from './use-name-draft'

/** Better Auth renames the organization (owners and admins); the loader then rereads the name. */
export function useWorkspaceRename(workspaceId: string, current: string) {
  const router = useRouter()
  return useNameDraft(current, async (next) => {
    const { error } = await auth.organization.update({
      organizationId: workspaceId,
      data: { name: next },
    })
    if (error) throw new Error(error.message ?? 'the server refused the new name')
    await router.invalidate()
  })
}
