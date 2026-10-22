import { IconFile, IconFileText, IconPhoto } from '@tabler/icons-react'
import { useState } from 'react'
import { SheetIcon } from '../sheet-icon'
import { useSheetsStore } from '../stores'
import { type AttachMenuProps, UPLOAD_ACCEPT } from './lib'

const ROW =
  'flex w-full items-center gap-2.5 rounded-lg px-2 py-[7px] text-left text-[12.5px] hover:bg-accent'

/** What rides with the ask: a page from the workspace (by id), a file, a picture. */
export function AttachMenu({ onPage, onFile, onClose, canUpload }: AttachMenuProps) {
  const sheets = useSheetsStore((state) => state.sheets)
  const [term, setTerm] = useState<string | null>(null)
  const needle = term?.trim().toLowerCase() ?? ''
  const pages =
    term === null
      ? []
      : sheets.filter((sheet) => !needle || sheet.title.toLowerCase().includes(needle)).slice(0, 8)

  return (
    <div className="absolute bottom-full left-0 z-[60] mb-1.5 w-[260px] rounded-xl border border-border bg-popover p-[5px] text-popover-foreground shadow-[0_12px_36px_rgb(0_0_0/0.18)]">
      {term === null ? (
        <>
          <button type="button" onClick={() => setTerm('')} className={ROW}>
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
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Which page?"
            className="mb-1 h-8 w-full rounded-lg border border-border bg-background px-2 text-[12.5px] outline-none focus-visible:border-primary"
          />
          <div className="max-h-[240px] overflow-y-auto">
            {pages.map((sheet) => (
              <button
                key={sheet.id}
                type="button"
                onClick={() => {
                  onPage({ kind: 'page', id: sheet.id, name: sheet.title })
                  onClose()
                }}
                className={ROW}
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
