import { createFileRoute } from '@tanstack/react-router'
import { RoutinesView } from '@/components/views'

export const Route = createFileRoute('/w/$workspaceId/routines/')({
  ssr: false,
  component: RoutinesView,
})
