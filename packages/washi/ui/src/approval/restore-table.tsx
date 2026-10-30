import { type RestoreTableProps, useRestoreTable } from './lib'
import { RestoreButton } from './restore-button'

export function RestoreTable({ id }: RestoreTableProps) {
  const { state, restore } = useRestoreTable(id)
  return <RestoreButton state={state} onRestore={() => void restore()} />
}
