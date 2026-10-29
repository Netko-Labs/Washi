import { createFileRoute } from '@tanstack/react-router'
import { NewWorkspacePage } from '@/components/new-workspace'

export const Route = createFileRoute('/new')({
  ssr: false,
  head: () => ({ meta: [{ title: 'New workspace · Washi' }] }),
  component: NewWorkspacePage,
})
