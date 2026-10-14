import { createFileRoute } from '@tanstack/react-router'
import { DashboardView } from '@/components/views'

export const Route = createFileRoute('/w/$workspaceId/')({
  ssr: false,
  component: DashboardView,
})
