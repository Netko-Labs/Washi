import { IconArrowUpRight } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { SheetIcon, useSheetsStore } from '@washi/ui'
import type { ChatPageCardProps } from './lib'

/** A page Washi wrote this turn, if the reader can still open it. */
export function ChatPageCard({ page, workspaceId }: ChatPageCardProps) {
  const sheet = useSheetsStore((state) => state.sheets.find((each) => each.id === page.id))
  if (!sheet) return null

  return (
    <Link
      to="/w/$workspaceId/p/$pageId"
      params={{ workspaceId, pageId: page.id }}
      className="group/card flex min-h-14 w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 hover:bg-accent"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted">
        <SheetIcon name={sheet.icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-[14px]">{sheet.title || page.title}</span>
        <span className="block text-[12px] text-muted-foreground">
          {page.touch === 'made' ? 'Made' : 'Changed'}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5 text-[12.5px] text-muted-foreground group-hover/card:text-foreground">
        Open
        <IconArrowUpRight className="size-3.5" />
      </span>
    </Link>
  )
}
