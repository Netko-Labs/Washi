import { useRouteTab } from '@/components/shell'
import { TrashPage } from '@/components/trash'

export function TrashView() {
  useRouteTab('view:trash')
  return <TrashPage />
}
