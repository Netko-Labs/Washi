import {
  IconCalendar,
  IconInbox,
  IconLayoutDashboard,
  IconPlus,
  IconSettings,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { useRef } from 'react'
import { SheetIcon } from '../sheet-icon'
import { type TabKey, useSheetsStore, useViewStore } from '../stores'
import type { TabInfo } from './types'

const VIEW_TABS: Record<string, TabInfo> = {
  'view:dashboard': { label: 'Dashboard', icon: <IconLayoutDashboard className="size-[13px]" /> },
  'view:inbox': { label: 'Inbox', icon: <IconInbox className="size-[13px]" /> },
  'view:daily': { label: 'Daily note', icon: <IconCalendar className="size-[13px]" /> },
  'view:settings': { label: 'Settings', icon: <IconSettings className="size-[13px]" /> },
  'view:trash': { label: 'Trash', icon: <IconTrash className="size-[13px]" /> },
}

/** Browser-style tab strip (Washi.dc.html rev 2): drag to reorder, middle-click to close. */
export function TabStrip() {
  const { tabs, activeTab, openTab, closeTab, moveTab } = useViewStore()
  const { sheets, createSheet } = useSheetsStore()
  const dragged = useRef<TabKey | null>(null)

  const labelFor = (key: TabKey): TabInfo | null => {
    if (key.startsWith('view:')) return VIEW_TABS[key] ?? null
    const sheet = sheets.find((item) => item.id === key.slice(5))
    if (!sheet) return null
    return {
      label: sheet.title,
      icon: <SheetIcon name={sheet.icon} className="size-[13px]" />,
    }
  }

  return (
    <div
      role="tablist"
      className="app-drag flex items-end gap-0.5 overflow-x-auto border-border border-b bg-muted px-2 pt-1.5"
    >
      {tabs.map((key) => {
        const info = labelFor(key)
        if (!info) return null
        const active = key === activeTab
        return (
          <div
            key={key}
            role="tab"
            aria-selected={active}
            tabIndex={-1}
            draggable
            onDragStart={(event) => {
              dragged.current = key
              event.dataTransfer.effectAllowed = 'move'
            }}
            onDragEnter={() => {
              if (dragged.current && dragged.current !== key) moveTab(dragged.current, key)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragEnd={() => {
              dragged.current = null
            }}
            onAuxClick={(event) => {
              if (event.button === 1) closeTab(key)
            }}
            data-tab={key}
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
