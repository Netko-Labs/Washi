import { SheetIcon, useSheetsStore, useViewStore } from '@washi/ui'
import { type BacklinksProps, useBacklinks } from './lib'

/** Notion's backlinks: every page that points here, under the page. */
export function Backlinks({ pageId }: BacklinksProps) {
  const version = useSheetsStore((state) => state.sheets.map((sheet) => sheet.hlcUpdated).join())
  const pages = useBacklinks(pageId, version)
  if (pages.length === 0) return null

  return (
    <section className="mx-auto max-w-[1200px] px-8 pt-6 pb-16" aria-label="Linked from">
      <h2 className="mb-2 font-semibold text-[12px] text-muted-foreground uppercase tracking-[0.06em]">
        Linked from
      </h2>
      <ul className="flex flex-wrap gap-1.5">
        {pages.map((page) => (
          <li key={page.id}>
            <button
              type="button"
              onClick={() => useViewStore.getState().openTab(`note:${page.id}`)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[13px] hover:bg-accent"
            >
              <SheetIcon name={page.icon} className="size-4 text-muted-foreground" />
              {page.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
