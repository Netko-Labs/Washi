import { createFileRoute } from '@tanstack/react-router'
import type { RoutineTab } from '@/components/routines'
import { RoutineView } from '@/components/views'

export const Route = createFileRoute('/w/$workspaceId/routines/$routineId')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { tab: RoutineTab } => ({
    tab: search.tab === 'runs' ? 'runs' : 'setup',
  }),
  component: RoutineView,
})
