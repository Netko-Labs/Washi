import { getRouteApi } from '@tanstack/react-router'
import { useStorage } from './lib'
import { StorageForm } from './storage-form'
import { StorageSummary } from './storage-summary'

const workspaceRoute = getRouteApi('/w/$workspaceId')

/** Where the workspace's uploads go: the server's store, or a bucket the team brings. */
export function StorageSection() {
  const { workspace } = workspaceRoute.useLoaderData()
  const { state, error, refresh, remove } = useStorage()
  const canEdit = workspace.role === 'owner' || workspace.role === 'admin'

  if (!state) {
    return error ? <p className="text-[13px] text-destructive">{error}</p> : null
  }

  return (
    <div className="grid gap-4">
      <StorageSummary state={state} canEdit={canEdit} onRemove={remove} />
      {canEdit && state.isAvailable && (
        <StorageForm isReplacing={!state.isServerDefault} onSaved={refresh} />
      )}
      {error && <p className="text-[13px] text-destructive">{error}</p>}
    </div>
  )
}
