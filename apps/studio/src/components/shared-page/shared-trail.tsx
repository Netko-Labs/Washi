import { IconChevronRight } from '@tabler/icons-react'
import { Fragment } from 'react'
import { type SharedTrailProps, trailTo } from './lib'

/** Where a sub-page sits under the link's own page (D123): each step opens in place. */
export function SharedTrail({ page, onOpen }: SharedTrailProps) {
  const isHome = page.id === page.home.id
  if (isHome && page.pages.length === 0) return null
  const trail = isHome ? [] : trailTo(page.id, page.pages)
  return (
    <nav
      aria-label="Pages on this link"
      className="flex min-w-0 items-center gap-1 overflow-x-auto px-4 py-2 text-[12.5px] text-muted-foreground"
    >
      <button
        type="button"
        onClick={() => onOpen(undefined)}
        aria-current={isHome ? 'page' : undefined}
        className="shrink-0 rounded px-1.5 py-0.5 hover:bg-accent pointer-coarse:min-h-10 hover:text-foreground aria-[current=page]:text-foreground"
      >
        {page.home.title}
      </button>
      {trail.map((step) => (
        <Fragment key={step.id}>
          <IconChevronRight aria-hidden className="size-3.5 shrink-0" />
          <button
            type="button"
            onClick={() => onOpen(step.id)}
            aria-current={step.id === page.id ? 'page' : undefined}
            className="max-w-[16rem] shrink-0 truncate rounded px-1.5 py-0.5 hover:bg-accent pointer-coarse:min-h-10 hover:text-foreground aria-[current=page]:text-foreground"
          >
            {step.title}
          </button>
        </Fragment>
      ))}
    </nav>
  )
}
