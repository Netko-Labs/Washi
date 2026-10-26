import { createFileRoute } from '@tanstack/react-router'
import { NewWorkspacePage } from '@/components/new-workspace'

export const Route = createFileRoute('/new')({
  ssr: false,
  component: NewWorkspacePage,
})
