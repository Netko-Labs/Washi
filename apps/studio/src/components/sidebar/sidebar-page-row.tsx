import {
  ConfirmDeleteButton,
  SheetIcon,
  useAgentStore,
  useSheetsStore,
  useViewStore,
} from '@washi/ui'
import { pathFor } from '@/components/shell'
import { openInPlace, type SidebarPageRowProps } from './lib'

export function SidebarPageRow({ sheet, workspaceId, onNavigate }: SidebarPageRowProps) {
  const running = useAgentStore((state) => state.running)
  const active = useViewStore((state) => state.activeTab === `note:${sheet.id}`)

  return (
    <div
      className={`group flex h-12 items-center rounded-lg md:h-[29px] ${
        active ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent'
      }`}
    >
      <a
        href={pathFor(workspaceId, `note:${sheet.id}`)}
        aria-label={`Open ${sheet.title}`}
        onClick={(event) =>
          openInPlace(event, () => {
            useViewStore.getState().openTab(`note:${sheet.id}`)
            onNavigate()
          })
        }
        className="flex h-full min-w-0 flex-1 items-center gap-2 px-2 text-left text-[15px] md:text-[13px]"
      >
        <SheetIcon name={sheet.icon} className="size-[18px] shrink-0 md:size-[15px]" />
        <span className="truncate">{sheet.title}</span>
        {active && running && (
          <span
            className="ml-auto size-1.5 shrink-0 rounded-full bg-agent"
            style={{ animation: 'wdot 2s ease-in-out infinite' }}
          />
        )}
      </a>
      <span className="mr-1 hidden shrink-0 group-focus-within:block group-hover:block">
        <ConfirmDeleteButton
          label={`Delete ${sheet.title}`}
          onConfirm={() => void useSheetsStore.getState().deleteSheet(sheet.id)}
        />
      </span>
    </div>
  )
}
