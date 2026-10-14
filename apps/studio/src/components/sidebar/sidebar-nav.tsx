import { useAgentStore, useViewStore } from '@washi/ui'
import { pathFor } from '@/components/shell'
import { NAV, openInPlace, type SidebarSectionProps } from './lib'

export function SidebarNav({ workspaceId, onNavigate }: SidebarSectionProps) {
  const inboxCount = useAgentStore((state) => state.approvals.length)
  const activeTab = useViewStore((state) => state.activeTab)

  return (
    <nav className="space-y-px px-2 pt-2">
      {NAV.map(({ tab, label, icon: Icon }) => (
        <a
          key={tab}
          href={pathFor(workspaceId, tab)}
          onClick={(event) =>
            openInPlace(event, () => {
              useViewStore.getState().openTab(tab)
              onNavigate()
            })
          }
          className={`flex h-9 w-full items-center gap-2 rounded-lg px-2 text-[13px] md:h-[30px] ${
            activeTab === tab
              ? 'bg-accent font-medium text-foreground'
              : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <Icon className="size-[15px]" />
          <span className="flex-1 text-left">{label}</span>
          {tab === 'view:inbox' && inboxCount > 0 && (
            <span className="flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-primary px-[5px] font-semibold text-[10.5px] text-primary-foreground">
              {inboxCount}
            </span>
          )}
        </a>
      ))}
    </nav>
  )
}
