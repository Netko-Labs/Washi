import { unsplashLink } from '@washi/paper/registry'
import type { UnsplashTileProps } from './lib'

/** A photo and, under it, whom it is by — linked back to Unsplash as its guidelines ask. */
export function UnsplashTile({ photo, isPicking, onPick }: UnsplashTileProps) {
  return (
    <div className="grid min-w-0 gap-0.5">
      <button
        type="button"
        data-photo
        onClick={onPick}
        aria-label={
          photo.alt ? `${photo.alt}, by ${photo.photographer.name}` : photo.photographer.name
        }
        className={`h-16 overflow-hidden rounded-lg ring-offset-2 ring-offset-popover hover:ring-2 hover:ring-border focus-visible:ring-2 focus-visible:ring-primary ${
          isPicking ? 'animate-pulse' : ''
        }`}
        style={{ background: photo.color ?? undefined }}
      >
        <img
          src={photo.urls.small}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
        />
      </button>
      <a
        href={unsplashLink(photo.photographer.profileUrl)}
        target="_blank"
        rel="noreferrer"
        className="truncate text-[10.5px] text-muted-foreground hover:text-foreground"
      >
        {photo.photographer.name}
      </a>
    </div>
  )
}
