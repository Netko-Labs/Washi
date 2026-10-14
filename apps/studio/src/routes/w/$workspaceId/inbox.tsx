import { createFileRoute } from '@tanstack/react-router'
import { InboxView } from '@/components/views'

export const Route = createFileRoute('/w/$workspaceId/inbox')({
  ssr: false,
  component: InboxView,
})
