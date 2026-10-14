import { createFileRoute } from '@tanstack/react-router'
import { PageView } from '@/components/views'

export const Route = createFileRoute('/w/$workspaceId/p/$pageId')({
  ssr: false,
  component: PageView,
})
