import { IconCheck } from '@tabler/icons-react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { VaultIcon } from '@washi/ui'
import { topicFor, useWorkspaces } from '@/components/workspace'
import type { WorkspaceMenuProps } from './lib'
import { NewWorkspaceForm } from './new-workspace-form'

const route = getRouteApi('/w/$workspaceId')

const ROW = 'flex w-full items-center gap-2.5 rounded-lg px-2 text-left hover:bg-accent'

/** Opens on the loader's list and refreshes it, so a workspace made in another tab shows up. */
export function WorkspaceMenu({ currentId, onClose, placement = 'up' }: WorkspaceMenuProps) {
  const { workspaces: known } = route.useLoaderData()
  const { workspaces, error, create } = useWorkspaces(known)
  const navigate = useNavigate()

  return (
    <div
      role="dialog"
      aria-label="Switch workspace"
      className={`absolute left-0 z-50 w-[272px] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)] ${placement === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
    >
      <div className="px-2 pt-1 pb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
        Workspaces
      </div>
      <div className="max-h-[50vh] space-y-px overflow-y-auto">
        {workspaces.map((workspace) => (
          <Link
            key={workspace.id}
            to="/w/$workspaceId"
            params={{ workspaceId: workspace.id }}
            onClick={onClose}
            aria-current={workspace.id === currentId ? 'true' : undefined}
            className={`${ROW} h-11`}
          >
            <VaultIcon topic={topicFor(workspace.id)} size={26} className="shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-[13px]">{workspace.name}</span>
              <span className="block text-[11px] text-muted-foreground capitalize">
                {workspace.role}
              </span>
            </span>
            {workspace.id === currentId && <IconCheck className="size-4 shrink-0 text-primary" />}
          </Link>
        ))}
      </div>
      <div className="my-1.5 h-px bg-border" />
      <NewWorkspaceForm
        error={error}
        onCreate={async (name) => {
          const workspaceId = await create(name)
          if (!workspaceId) return
          onClose()
          await navigate({ to: '/w/$workspaceId', params: { workspaceId } })
        }}
      />
    </div>
  )
}
