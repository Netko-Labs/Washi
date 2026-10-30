import { IconChevronRight, IconLock, IconPlus, IconWorld } from '@tabler/icons-react'
import {
  ConfirmDeleteButton,
  SheetIcon,
  useAgentStore,
  useSheetsStore,
  useViewStore,
} from '@washi/ui'
import { pathFor } from '@/components/shell'
import { openInPlace } from '../lib'
import { RowMenu } from '../row-menu'
import { INDENT_PX, type SidebarTreeRowProps, useRowDrag, useTreeStore } from './lib'

const DROP_LINE = 'pointer-events-none absolute right-1 h-0.5 rounded-full bg-primary'

export function SidebarTreeRow({
  sheet,
  depth,
  hasChildren,
  isExpanded,
  workspaceId,
  onNavigate,
  tabStop,
}: SidebarTreeRowProps) {
  const isActive = useViewStore((state) => state.activeTab === `note:${sheet.id}`)
  const isRunning = useAgentStore((state) => state.running)
  const { drop, isDragging, handlers } = useRowDrag(sheet)
  const indent = 4 + depth * INDENT_PX
  const addInside = () => {
    useTreeStore.getState().expand([sheet.id])
    void useSheetsStore.getState().createSheet(sheet.id)
    onNavigate()
  }

  return (
    <div
      {...handlers}
      role="treeitem"
      data-tree-id={sheet.id}
      tabIndex={tabStop === sheet.id ? 0 : -1}
      aria-label={sheet.title}
      aria-level={depth + 1}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isActive}
      onFocus={() => useTreeStore.getState().setCurrent(sheet.id)}
      className={`group relative flex h-12 items-center rounded-lg md:h-[29px] ${
        isActive ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent'
      } ${drop === 'inside' ? 'bg-primary/10 ring-1 ring-primary/40' : ''} ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      {drop === 'before' && <span className={`${DROP_LINE} -top-px`} style={{ left: indent }} />}
      {drop === 'after' && <span className={`${DROP_LINE} -bottom-px`} style={{ left: indent }} />}
      <span
        className="relative grid size-5 shrink-0 place-items-center max-md:flex max-md:h-full max-md:w-auto max-md:items-center"
        style={{ marginLeft: indent }}
      >
        {hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={isExpanded ? `Collapse ${sheet.title}` : `Expand ${sheet.title}`}
            onClick={() => useTreeStore.getState().toggle(sheet.id)}
            className="absolute inset-0 hidden place-items-center rounded text-muted-foreground hover:bg-border max-md:static max-md:grid max-md:h-full max-md:w-7 md:group-focus-within:grid md:group-hover:grid"
          >
            <IconChevronRight
              className={`size-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <span aria-hidden className="hidden w-7 max-md:block" />
        )}
        <SheetIcon
          name={sheet.icon}
          className={`size-[18px] md:size-[15px] ${hasChildren ? 'md:group-focus-within:invisible md:group-hover:invisible' : ''}`}
        />
      </span>
      <a
        href={pathFor(workspaceId, `note:${sheet.id}`)}
        draggable={false}
        tabIndex={-1}
        onClick={(event) =>
          openInPlace(event, () => {
            useViewStore.getState().openTab(`note:${sheet.id}`)
            onNavigate()
          })
        }
        className="flex h-full min-w-0 flex-1 items-center gap-2 pr-1 pl-1.5 text-left text-[15px] md:text-[13px]"
      >
        <span className="truncate">{sheet.title}</span>
        {sheet.visibility === 'private' && (
          <IconLock aria-label="Only some people" className="size-3 shrink-0 opacity-60" />
        )}
        {sheet.visibility === 'public' && (
          <IconWorld aria-label="On a public link" className="size-3 shrink-0 opacity-60" />
        )}
        {isActive && isRunning && (
          <span
            className="ml-auto size-1.5 shrink-0 rounded-full bg-agent"
            style={{ animation: 'wdot 2s ease-in-out infinite' }}
          />
        )}
      </a>
      <span className="mr-1 hidden shrink-0 items-center md:group-focus-within:flex md:group-hover:flex">
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Add a page inside ${sheet.title}`}
          title="Add a page inside"
          onClick={addInside}
          className="grid size-6 place-items-center rounded text-muted-foreground hover:text-foreground"
        >
          <IconPlus className="size-3.5" />
        </button>
        <ConfirmDeleteButton
          tabIndex={-1}
          label={`Delete ${sheet.title}`}
          onConfirm={() => void useSheetsStore.getState().deleteSheet(sheet.id)}
        />
      </span>
      <RowMenu sheet={sheet} onAddInside={addInside} tabIndex={-1} />
    </div>
  )
}
