import { createFileRoute } from '@tanstack/react-router'
import { DatabasesView } from '@/components/views'

export const Route = createFileRoute('/w/$workspaceId/databases')({
  ssr: false,
  component: DatabasesView,
})
