import {
  IconCalendar,
  IconInbox,
  IconLayoutDashboard,
  IconPlus,
  IconSettings,
  IconX,
} from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { SheetIcon } from '../sheet-icon'
import { useSheetsStore } from '../stores/sheets/sheets-store'
import { type TabKey, useViewStore } from '../stores/view/view-store'

const VIEW_TABS: Record<string, { label: string; icon: ReactNode }> = {
  'view:dashboard': { label: 'Dashboard', icon: <IconLayoutDashboard className="size-[13px]" /> },
  'view:inbox': { label: 'Inbox', icon: <IconInbox className="size-[13px]" /> },
  'view:daily': { label: 'Daily note', icon: <IconCalendar className="size-[13px]" /> },
  'view:settings': { label: 'Settings', icon: <IconSettings className="size-[13px]" /> },
}

/** Browser-style tab strip above the header (Washi.dc.html rev 2). */
export function TabStrip() {
  const { tabs, activeTab, openTab, closeTab } = useViewStore()
  const { sheets, createSheet } = useSheetsStore()

  const labelFor = (key: TabKey): { label: string; icon: ReactNode } | null => {
    if (key.startsWith('view:')) return VIEW_TABS[key] ?? null
    const sheet = sheets.find((item) => item.id === key.slice(5))
    if (!sheet) return null
    return {
      label: sheet.title,
      icon: <SheetIcon name={sheet.icon} className="size-[13px]" />,
    }
  }

  return (
    <div className="app-drag flex items-end gap-0.5 overflow-x-auto border-border border-b bg-muted px-2 pt-1.5">
      {tabs.map((key) => {
        const info = labelFor(key)
        if (!info) return null
        const active = key === activeTab
        return (
          <div
            key={key}
            className={`app-no-drag flex h-[31px] max-w-[190px] min-w-0 flex-initial cursor-pointer items-center gap-1.5 rounded-t-lg border border-b-0 pr-1 pl-2.5 text-[12.5px] ${
              active
                ? 'border-border bg-background font-medium text-foreground'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            <button
              type="button"
              onClick={() => openTab(key)}
              className="flex min-w-0 items-center gap-1.5"
            >
              {info.icon}
              <span className="truncate">{info.label}</span>
            </button>
            <button
              type="button"
              aria-label={`Close ${info.label}`}
              onClick={() => closeTab(key)}
              className="grid size-[18px] shrink-0 place-items-center rounded-[5px] hover:bg-accent hover:text-foreground"
            >
              <IconX className="size-3" />
            </button>
          </div>
        )
      })}
      <button
        type="button"
        aria-label="New tab"
        onClick={() => void createSheet()}
        className="app-no-drag mb-[3px] grid size-[26px] shrink-0 place-items-center rounded-[7px] text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <IconPlus className="size-3.5" />
      </button>
    </div>
  )
}
