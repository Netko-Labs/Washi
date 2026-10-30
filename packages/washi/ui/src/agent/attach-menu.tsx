import { IconFile, IconFileText, IconPhoto } from '@tabler/icons-react'
import { SheetIcon } from '../sheet-icon'
import { type AttachMenuProps, UPLOAD_ACCEPT, useAttachMenu } from './lib'

const ROW =
  'flex w-full items-center gap-2.5 rounded-lg px-2 py-[7px] text-left text-[12.5px] hover:bg-accent'
const LIST_ID = 'washi-attach-pages'

/** What rides with the ask: a page from the workspace (by id), a file, a picture. */
export function AttachMenu({ onPage, onFile, onClose, canUpload }: AttachMenuProps) {
  const menu = useAttachMenu({ onPage, onClose })
  const { search, pages, active } = menu

  return (
    <div
      ref={menu.root}
      className="absolute bottom-full left-0 z-[60] mb-1.5 w-[260px] rounded-xl border border-border bg-popover p-[5px] text-popover-foreground shadow-[0_12px_36px_rgb(0_0_0/0.18)]"
    >
      {search === null ? (
        <>
          <button type="button" onClick={menu.open} className={ROW}>
            <IconFileText className="size-4 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block">A page from this workspace</span>
              <span className="block text-[11px] text-muted-foreground">
                Washi reads it with the ask
              </span>
            </span>
          </button>
          {canUpload && (
            <>
              <label className={`${ROW} cursor-pointer`}>
                <IconFile className="size-4 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block">A file</span>
                  <span className="block text-[11px] text-muted-foreground">
                    Text, CSV, Markdown · up to 5 MB
                  </span>
                </span>
                <input
                  type="file"
                  accept={UPLOAD_ACCEPT}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      onFile(file)
                      onClose()
                    }
                  }}
                />
              </label>
              <label className={`${ROW} cursor-pointer`}>
                <IconPhoto className="size-4 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block">A picture</span>
                  <span className="block text-[11px] text-muted-foreground">JPG, PNG, WebP</span>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      onFile(file)
                      onClose()
                    }
                  }}
                />
              </label>
            </>
          )}
        </>
      ) : (
        <>
          <input
            ref={(node) => node?.focus()}
            value={search.term}
            onChange={(event) => menu.setTerm(event.target.value)}
            onKeyDown={menu.onKeyDown}
            role="combobox"
            aria-expanded
            aria-controls={LIST_ID}
            aria-activedescendant={pages[active] ? `${LIST_ID}-${active}` : undefined}
            aria-label="Which page?"
            placeholder="Which page?"
            className="mb-1 h-8 w-full rounded-lg border border-border bg-background px-2 text-[12.5px] outline-none focus-visible:border-primary"
          />
          <div id={LIST_ID} role="listbox" className="max-h-[240px] overflow-y-auto">
            {pages.map((sheet, index) => (
              <button
                key={sheet.id}
                id={`${LIST_ID}-${index}`}
                type="button"
                role="option"
                aria-selected={index === active}
                tabIndex={-1}
                onClick={() => menu.pick(sheet)}
                onMouseEnter={() => menu.hover(index)}
                className={`${ROW} ${index === active ? 'bg-accent' : ''}`}
              >
                <SheetIcon name={sheet.icon} className="size-4 text-muted-foreground" />
                <span className="truncate">{sheet.title}</span>
              </button>
            ))}
            {pages.length === 0 && (
              <p className="px-2 py-3 text-[12px] text-muted-foreground">Nothing matches that.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
