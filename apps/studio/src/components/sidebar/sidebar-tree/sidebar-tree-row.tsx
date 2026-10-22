import { IconChevronRight, IconPlus } from '@tabler/icons-react'
import {
  ConfirmDeleteButton,
  SheetIcon,
  useAgentStore,
  useSheetsStore,
  useViewStore,
} from '@washi/ui'
import { pathFor } from '@/components/shell'
import { openInPlace } from '../lib'
import { INDENT_PX, type SidebarTreeRowProps, useRowDrag, useTreeStore } from './lib'

const DROP_LINE = 'pointer-events-none absolute right-1 h-0.5 rounded-full bg-primary'

export function SidebarTreeRow({
  sheet,
  depth,
  hasChildren,
  isExpanded,
  workspaceId,
  onNavigate,
}: SidebarTreeRowProps) {
  const isActive = useViewStore((state) => state.activeTab === `note:${sheet.id}`)
  const isRunning = useAgentStore((state) => state.running)
  const { drop, isDragging, handlers } = useRowDrag(sheet)
  const indent = 4 + depth * INDENT_PX

  return (
    <div
      {...handlers}
      role="treeitem"
      tabIndex={-1}
      aria-level={depth + 1}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isActive}
      className={`group relative flex h-12 items-center rounded-lg md:h-[29px] ${
        isActive ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent'
      } ${drop === 'inside' ? 'bg-primary/10 ring-1 ring-primary/40' : ''} ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      {drop === 'before' && <span className={`${DROP_LINE} -top-px`} style={{ left: indent }} />}
      {drop === 'after' && <span className={`${DROP_LINE} -bottom-px`} style={{ left: indent }} />}
      <span
        className="relative grid size-5 shrink-0 place-items-center"
        style={{ marginLeft: indent }}
      >
        <SheetIcon
          name={sheet.icon}
          className={`size-[18px] md:size-[15px] ${hasChildren ? 'max-md:invisible group-focus-within:invisible group-hover:invisible' : ''}`}
        />
        {hasChildren && (
          <button
            type="button"
            aria-label={isExpanded ? `Collapse ${sheet.title}` : `Expand ${sheet.title}`}
            onClick={() => useTreeStore.getState().toggle(sheet.id)}
            className="absolute inset-0 hidden place-items-center rounded text-muted-foreground hover:bg-border group-focus-within:grid group-hover:grid max-md:grid"
          >
            <IconChevronRight
              className={`size-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        )}
      </span>
      <a
        href={pathFor(workspaceId, `note:${sheet.id}`)}
        draggable={false}
        aria-label={`Open ${sheet.title}`}
        onClick={(event) =>
          openInPlace(event, () => {
            useViewStore.getState().openTab(`note:${sheet.id}`)
            onNavigate()
          })
        }
        className="flex h-full min-w-0 flex-1 items-center gap-2 pr-1 pl-1.5 text-left text-[15px] md:text-[13px]"
      >
        <span className="truncate">{sheet.title}</span>
        {isActive && isRunning && (
          <span
            className="ml-auto size-1.5 shrink-0 rounded-full bg-agent"
            style={{ animation: 'wdot 2s ease-in-out infinite' }}
          />
        )}
      </a>
      <span className="mr-1 hidden shrink-0 items-center group-focus-within:flex group-hover:flex">
        <button
          type="button"
          aria-label={`Add a page inside ${sheet.title}`}
          title="Add a page inside"
          onClick={() => {
            useTreeStore.getState().expand([sheet.id])
            void useSheetsStore.getState().createSheet(sheet.id)
            onNavigate()
          }}
          className="grid size-6 place-items-center rounded text-muted-foreground hover:text-foreground"
        >
          <IconPlus className="size-3.5" />
        </button>
        <ConfirmDeleteButton
          label={`Delete ${sheet.title}`}
          onConfirm={() => void useSheetsStore.getState().deleteSheet(sheet.id)}
        />
      </span>
    </div>
  )
}
