import { useAgentStore, useViewStore } from '@washi/ui'
import { NAV } from './lib'

export function SidebarNav({ onNavigate }: { onNavigate: () => void }) {
  const inboxCount = useAgentStore((state) => state.approvals.length)
  const { activeTab, openTab } = useViewStore()

  return (
    <nav className="space-y-px px-2 pt-2">
      {NAV.map(({ tab, label, icon: Icon }) => (
        <button
          key={tab}
          type="button"
          onClick={() => {
            openTab(tab)
            onNavigate()
          }}
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
        </button>
      ))}
    </nav>
  )
}
