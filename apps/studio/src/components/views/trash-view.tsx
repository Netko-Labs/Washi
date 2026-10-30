import { TrashPage } from '@/components/trash'
import { useScreen } from './lib'

export function TrashView() {
  useScreen('view:trash', ['Trash'])
  return <TrashPage />
}
