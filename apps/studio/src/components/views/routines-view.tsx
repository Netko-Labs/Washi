import { getRouteApi, useParams, useSearch } from '@tanstack/react-router'
import { RoutinePage, RoutinesPage, type RoutineTab } from '@/components/routines'
import { useRouteTab } from '@/components/shell'

const workspaceRoute = getRouteApi('/w/$workspaceId')

export function RoutinesView() {
  const { workspaceId } = workspaceRoute.useParams()
  useRouteTab('view:routines')
  return <RoutinesPage workspaceId={workspaceId} />
}

/** `/routines/new` (maybe `?template=`) and `/routines/$id?tab=`; keyed so another is another page. */
export function RoutineView() {
  const { workspaceId, routineId } = useParams({ strict: false })
  const search = useSearch({ strict: false }) as { tab?: RoutineTab; template?: string }
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
