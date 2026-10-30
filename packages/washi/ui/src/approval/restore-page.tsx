import { type RestorePageProps, useRestorePage } from './lib'
import { RestoreButton } from './restore-button'

export function RestorePage({ id }: RestorePageProps) {
  const { state, restore } = useRestorePage(id)
  return <RestoreButton state={state} onRestore={() => void restore()} />
}
