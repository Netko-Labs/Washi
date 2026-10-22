import { SheetIcon, useViewStore } from '@washi/ui'
import { pathFor } from '@/components/shell'
import { LABEL, openInPlace, type SidebarSectionProps, useRecents } from './lib'

/** What you touched last, with an age — the list the tab strip used to be. */
export function SidebarRecents({ workspaceId, onNavigate }: SidebarSectionProps) {
  const recents = useRecents(workspaceId)
  if (recents.length === 0) return null

  return (
    <>
      <div className={LABEL}>Recents</div>
      <div className="grid grid-cols-3 gap-2 md:block md:space-y-px">
        {recents.map(({ sheet, age }) => (
          <a
            key={sheet.id}
            href={pathFor(workspaceId, `note:${sheet.id}`)}
            onClick={(event) =>
              openInPlace(event, () => {
                useViewStore.getState().openTab(`note:${sheet.id}`)
                onNavigate()
              })
            }
            className="flex min-w-0 flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-2.5 text-[13px] text-muted-foreground hover:bg-accent md:h-[26px] md:flex-row md:items-center md:gap-2 md:rounded-lg md:border-0 md:bg-transparent md:p-0 md:px-2 md:text-[12.5px]"
          >
            <SheetIcon name={sheet.icon} className="size-[18px] shrink-0 md:size-[14px]" />
            <span className="w-full min-w-0 flex-1 truncate">{sheet.title}</span>
            <span className="font-mono text-[10.5px] opacity-80">{age}</span>
          </a>
        ))}
      </div>
    </>
  )
}
