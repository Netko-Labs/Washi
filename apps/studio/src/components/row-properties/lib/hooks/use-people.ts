import { getRouteApi } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useCommentsStore } from '@/components/comments'

const workspaceRoute = getRouteApi('/w/$workspaceId')

/** Member names by id — a person cell holds an id, the page shows a name. */
export function usePeople(): Record<string, string> {
  const { workspace } = workspaceRoute.useLoaderData()
  const members = useCommentsStore((state) => state.members)

  useEffect(() => {
    if (useCommentsStore.getState().members.length === 0) {
      void useCommentsStore.getState().loadMembers(workspace.id)
    }
  }, [workspace.id])

  return Object.fromEntries(members.map((member) => [member.id, member.name]))
}
