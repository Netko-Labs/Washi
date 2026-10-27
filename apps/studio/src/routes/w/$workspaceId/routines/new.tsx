import { createFileRoute } from '@tanstack/react-router'
import { RoutineView } from '@/components/views'

export const Route = createFileRoute('/w/$workspaceId/routines/new')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { template?: string } =>
    typeof search.template === 'string' ? { template: search.template } : {},
  component: RoutineView,
})
