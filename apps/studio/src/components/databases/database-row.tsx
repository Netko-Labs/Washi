import { IconDatabase } from '@tabler/icons-react'
import { relativeTime, SheetIcon, useViewStore } from '@washi/ui'
import { DatabaseRowMenu } from './database-row-menu'
import { type DatabaseRowProps, sizeLabel } from './lib'

export function DatabaseRow({ entry, onOpen, onTrash }: DatabaseRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent">
      <IconDatabase className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpen}
          className="block max-w-full truncate text-left font-medium text-[13.5px] hover:underline"
        >
          {entry.name}
        </button>
        <span className="block text-[12px] text-muted-foreground">
          {sizeLabel(entry.rows, entry.columns)} · changed {relativeTime(entry.updated)}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1">
          {entry.pages.length === 0 ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11.5px] text-muted-foreground">
              Not on any page
            </span>
          ) : (
            <>
              <span className="text-[11.5px] text-muted-foreground">Shown on</span>
              {entry.pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => useViewStore.getState().openTab(`note:${page.id}`)}
                  className="flex h-6 max-w-[200px] items-center gap-1 rounded-full border border-border px-2 text-[11.5px] hover:border-primary hover:text-primary"
                >
                  <SheetIcon name={page.icon} className="size-3 shrink-0" />
                  <span className="truncate">{page.title}</span>
                </button>
              ))}
            </>
          )}
        </span>
      </span>
      <DatabaseRowMenu name={entry.name} onOpen={onOpen} onTrash={onTrash} />
    </li>
  )
}
