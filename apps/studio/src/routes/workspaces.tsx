import { createFileRoute } from '@tanstack/react-router'
import { WorkspacesPage } from '@/components/workspace'

export const Route = createFileRoute('/workspaces')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Workspaces · Washi' }] }),
  validateSearch: (search: Record<string, unknown>): { invite?: string } => ({
    invite: typeof search.invite === 'string' ? search.invite : undefined,
  }),
  component: WorkspacesPage,
})
