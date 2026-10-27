import { createFileRoute } from '@tanstack/react-router'
import { ChatView } from '@/components/views'

export const Route = createFileRoute('/w/$workspaceId/chats/new')({
  ssr: false,
  component: ChatView,
})
