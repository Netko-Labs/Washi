import { createFileRoute } from '@tanstack/react-router'
import { ChatsView } from '@/components/views'

export const Route = createFileRoute('/w/$workspaceId/chats/')({
  ssr: false,
  component: ChatsView,
})
