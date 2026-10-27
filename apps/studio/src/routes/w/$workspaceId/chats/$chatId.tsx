import { createFileRoute } from '@tanstack/react-router'
import { ChatView } from '@/components/views'

export const Route = createFileRoute('/w/$workspaceId/chats/$chatId')({
  ssr: false,
  component: ChatView,
})
