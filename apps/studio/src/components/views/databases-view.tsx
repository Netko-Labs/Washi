import { DatabasesPage } from '@/components/databases'
import { useRouteTab } from '@/components/shell'

export function DatabasesView() {
  useRouteTab('view:databases')
  return <DatabasesPage />
}
