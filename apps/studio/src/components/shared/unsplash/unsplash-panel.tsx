import { IconSearch } from '@tabler/icons-react'
import { UNSPLASH_HOME, unsplashLink } from '@washi/paper/registry'
import { NO_KEY_COPY, type UnsplashPanelProps, useUnsplashSearch, walkGrid } from './lib'
import { UnsplashTile } from './unsplash-tile'

/** A stable ref callback: React runs it on mount only, so focus is taken once. */
const focusOnMount = (node: HTMLInputElement | null) => node?.focus()

/** Unsplash's free photos, searched on Enter; a pick lands as the workspace keeps it (D117). */
export function UnsplashPanel({ onPicked }: UnsplashPanelProps) {
  const unsplash = useUnsplashSearch(onPicked)

  if (unsplash.ready === null) {
    return <p className="px-1 py-4 text-[12.5px] text-muted-foreground">Checking for a key…</p>
  }
  if (!unsplash.ready) {
    return <p className="px-1 py-3 text-[12.5px] text-muted-foreground">{NO_KEY_COPY}</p>
  }

  return (
    <div className="grid gap-2">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const query = new FormData(event.currentTarget).get('query')
          void unsplash.search(typeof query === 'string' ? query : '')
        }}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2"
      >
        <IconSearch className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          ref={focusOnMount}
          name="query"
          type="search"
          aria-label="Search Unsplash"
          placeholder="Search photos, then Enter"
          className="h-8 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
        />
      </form>

      {unsplash.asked && unsplash.photos.length === 0 && !unsplash.busy && !unsplash.error && (
        <p className="px-1 text-[12.5px] text-muted-foreground">
          No photos for “{unsplash.asked}”.
        </p>
      )}
      {unsplash.photos.length > 0 && (
        // biome-ignore lint/a11y/noStaticElementInteractions: the arrows walk the photos inside it
        <div
          onKeyDown={walkGrid}
          className="grid max-h-[260px] grid-cols-3 gap-1.5 overflow-y-auto p-0.5"
        >
          {unsplash.photos.map((photo) => (
            <UnsplashTile
              key={photo.id}
              photo={photo}
              isPicking={unsplash.picking === photo.id}
              onPick={() => void unsplash.pick(photo)}
            />
          ))}
          {unsplash.page < unsplash.totalPages && (
            <button
              type="button"
              onClick={() => void unsplash.more()}
              disabled={unsplash.busy}
              className="col-span-3 h-7 rounded-md text-[12px] text-muted-foreground hover:bg-accent"
            >
              More photos
            </button>
          )}
        </div>
      )}
      {unsplash.busy && <p className="px-1 text-[12px] text-muted-foreground">Searching…</p>}
      {unsplash.error && <p className="px-1 text-[12px] text-destructive">{unsplash.error}</p>}
      <a
        href={unsplashLink(UNSPLASH_HOME)}
        target="_blank"
        rel="noreferrer"
        className="px-1 text-[11px] text-muted-foreground hover:text-foreground"
      >
        Photos from Unsplash
      </a>
    </div>
  )
}
