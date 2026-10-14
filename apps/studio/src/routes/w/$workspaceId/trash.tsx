import { createFileRoute } from '@tanstack/react-router'
import { TrashView } from '@/components/views'

export const Route = createFileRoute('/w/$workspaceId/trash')({
  ssr: false,
  component: TrashView,
})
