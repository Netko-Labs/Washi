import { useParams, useSearch } from '@tanstack/react-router'
import { RoutinePage } from '@/components/routines'
import { useRouteTab } from '@/components/shell'
import type { RoutineSearch } from './lib'

/** `/routines/new` (maybe `?template=`) and `/routines/$id?tab=`; keyed so another is another page. */
export function RoutineView() {
  const { workspaceId, routineId } = useParams({ strict: false })
  const search = useSearch({ strict: false }) as RoutineSearch
  useRouteTab('view:routines')
  return (
    <RoutinePage
      key={routineId ?? `new:${search.template ?? ''}`}
      workspaceId={workspaceId ?? ''}
      routineId={routineId}
      template={search.template}
      tab={search.tab ?? 'setup'}
    />
  )
}
