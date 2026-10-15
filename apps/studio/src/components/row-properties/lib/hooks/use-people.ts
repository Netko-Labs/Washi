import { getRouteApi } from '@tanstack/react-router'
import type { Person } from '@washi/paper'
import { useEffect } from 'react'
import { useCommentsStore } from '@/components/comments'

const workspaceRoute = getRouteApi('/w/$workspaceId')

/** The workspace's members — a person cell holds an id, the page shows a name. */
export function usePeople(): Person[] {
  const { workspace } = workspaceRoute.useLoaderData()
  const members = useCommentsStore((state) => state.members)

  useEffect(() => {
    if (useCommentsStore.getState().members.length === 0) {
      void useCommentsStore.getState().loadMembers(workspace.id)
    }
  }, [workspace.id])

  return members.map((member) => ({ id: member.id, name: member.name }))
}
