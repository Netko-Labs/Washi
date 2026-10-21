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
          className="flex h-[26px] items-center gap-2 rounded-lg px-2 text-[12.5px] text-muted-foreground hover:bg-accent"
        >
          <SheetIcon name={sheet.icon} className="size-[14px] shrink-0" />
          <span className="min-w-0 flex-1 truncate">{sheet.title}</span>
          <span className="font-mono text-[10.5px] opacity-80">{age}</span>
        </a>
      ))}
    </>
  )
}
