import { IconCheck, IconPlus, IconSettings, IconUserPlus } from '@tabler/icons-react'
import { getRouteApi, Link } from '@tanstack/react-router'
import { VaultIcon } from '@washi/ui'
import { Floating } from '@/components/shared/floating'
import { topicFor, useWorkspaces } from '@/components/workspace'
import type { WorkspaceMenuProps } from './lib'

const route = getRouteApi('/w/$workspaceId')

const ROW = 'flex w-full items-center gap-2.5 rounded-lg px-2 text-left hover:bg-accent'
const SHORTCUT =
  'flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground'

/**
 * The workspace you are in, with its two errands, then the others. Opens on the loader's list
 * and refreshes it, so a workspace made in another tab shows up.
 */
export function WorkspaceMenu({
  anchor,
  currentId,
  onClose,
  placement = 'up',
}: WorkspaceMenuProps) {
  const { workspaces: known } = route.useLoaderData()
  const { workspaces } = useWorkspaces(known)
  const current = workspaces.find((workspace) => workspace.id === currentId)
  const others = workspaces.filter((workspace) => workspace.id !== currentId)

  return (
    <Floating
      anchor={anchor}
      side={placement === 'up' ? 'top' : 'bottom'}
      role="dialog"
      aria-label="Switch workspace"
      className="w-[280px] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.22)]"
    >
      {current && (
        <div className="rounded-lg bg-accent/50 p-2.5">
          <div className="flex items-center gap-2.5">
            <VaultIcon topic={topicFor(current.id)} size={32} className="shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-[13.5px]">{current.name}</span>
              <span className="block text-[11.5px] text-muted-foreground capitalize">
                {current.role}
              </span>
            </span>
            <IconCheck className="size-4 shrink-0 text-primary" />
          </div>
          <div className="mt-2.5 flex gap-1.5">
            <Link
              to="/w/$workspaceId/settings"
              params={{ workspaceId: current.id }}
              search={{ tab: 'general' }}
              onClick={onClose}
              className={SHORTCUT}
            >
              <IconSettings className="size-3.5" />
              Settings
            </Link>
            <Link
              to="/w/$workspaceId/settings"
              params={{ workspaceId: current.id }}
              search={{ tab: 'people' }}
              onClick={onClose}
              className={SHORTCUT}
            >
              <IconUserPlus className="size-3.5" />
              Invite
            </Link>
          </div>
        </div>
      )}
      {others.length > 0 && (
        <>
          <div className="px-2 pt-2.5 pb-1 font-medium text-[11px] text-muted-foreground">
            Switch to
          </div>
          <div className="max-h-[40vh] space-y-px overflow-y-auto">
            {others.map((workspace) => (
              <Link
                key={workspace.id}
                to="/w/$workspaceId"
                params={{ workspaceId: workspace.id }}
                onClick={onClose}
                className={`${ROW} h-10`}
              >
                <VaultIcon topic={topicFor(workspace.id)} size={24} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate text-[13px]">{workspace.name}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground capitalize">
                  {workspace.role}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
      <div className="my-1.5 h-px bg-border" />
      <Link to="/new" onClick={onClose} className={`${ROW} h-8 text-[13px] text-muted-foreground`}>
        <IconPlus className="size-[15px]" />
        New workspace
      </Link>
    </Floating>
  )
}
