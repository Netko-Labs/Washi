import { DatabasesPage } from '@/components/databases'
import { useScreen } from './lib'

export function DatabasesView() {
  useScreen('view:databases', ['Databases'])
  return <DatabasesPage />
}
