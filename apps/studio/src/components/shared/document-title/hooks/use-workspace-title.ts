import { getRouteApi } from '@tanstack/react-router'
import type { TitlePart } from '../types'
import { useDocumentTitle } from './use-document-title'

const workspaceRoute = getRouteApi('/w/$workspaceId')

/** Inside a workspace every title ends with its name: `Roadmap · Netko`, `Settings · People · Netko`. */
export function useWorkspaceTitle(parts: readonly TitlePart[]): void {
  const workspaceName = workspaceRoute.useLoaderData({ select: (data) => data.workspace.name })
  useDocumentTitle([...parts, workspaceName])
}
