import { createFileRoute } from '@tanstack/react-router'
import { loadWorkspace, WorkspaceLayout } from '@/components/shell'

export const Route = createFileRoute('/w/$workspaceId')({
  ssr: false,
  // Once per workspace: the loader resets the shared stores, so it must not rerun per tab.
  staleTime: Number.POSITIVE_INFINITY,
  loader: ({ params, location }) => loadWorkspace(params.workspaceId, location.href),
  component: WorkspaceLayout,
})
