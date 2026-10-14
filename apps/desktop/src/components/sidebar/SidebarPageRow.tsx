import {
  ConfirmDeleteButton,
  SheetIcon,
  useAgentStore,
  useSheetsStore,
  useViewStore,
} from '@washi/ui'
import type { SidebarPageRowProps } from './types'

export function SidebarPageRow({ sheet }: SidebarPageRowProps) {
  const running = useAgentStore((state) => state.running)
  const active = useViewStore((state) => state.activeTab === `note:${sheet.id}`)

  return (
    <div
      className={`group flex h-[29px] items-center rounded-lg ${
        active ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent'
      }`}
    >
      <button
        type="button"
        aria-label={`Open ${sheet.title}`}
        onClick={() => useViewStore.getState().openTab(`note:${sheet.id}`)}
        className="flex h-full min-w-0 flex-1 items-center gap-2 px-2 text-left text-[13px]"
      >
        <SheetIcon name={sheet.icon} className="size-[15px] shrink-0" />
        <span className="truncate">{sheet.title}</span>
        {active && running && (
          <span
            className="ml-auto size-1.5 shrink-0 rounded-full bg-agent"
            style={{ animation: 'wdot 2s ease-in-out infinite' }}
          />
        )}
      </button>
      <span className="mr-1 hidden shrink-0 group-focus-within:block group-hover:block">
        <ConfirmDeleteButton
          label={`Delete ${sheet.title}`}
          onConfirm={() => void useSheetsStore.getState().deleteSheet(sheet.id)}
        />
      </span>
    </div>
  )
}
