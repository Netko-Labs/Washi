import { getRouteApi } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useCommentsStore } from '../comments-store'

const workspaceRoute = getRouteApi('/w/$workspaceId')

/** The open panel follows the open page, and knows who can be mentioned. */
export function usePanelSheet(sheetId: string, isOpen: boolean) {
  const { workspace } = workspaceRoute.useLoaderData()

  useEffect(() => {
    if (isOpen && useCommentsStore.getState().sheetId !== sheetId) {
      void useCommentsStore.getState().load(sheetId)
    }
  }, [sheetId, isOpen])

  useEffect(() => {
    if (isOpen && useCommentsStore.getState().members.length === 0) {
      void useCommentsStore.getState().loadMembers(workspace.id)
    }
  }, [isOpen, workspace.id])
}
