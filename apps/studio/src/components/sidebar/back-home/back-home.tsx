import { IconChevronLeft } from '@tabler/icons-react'
import { useViewStore } from '@washi/ui'
import { pathFor } from '@/components/shell'
import { type BackHomeProps, openInPlace } from '../lib'

/** ‹ goes to Home, the dashboard. */
export function BackHome({ workspaceId }: BackHomeProps) {
  return (
    <a
      href={pathFor(workspaceId, 'view:dashboard')}
      onClick={(event) =>
        openInPlace(event, () => useViewStore.getState().openTab('view:dashboard'))
      }
      aria-label="Back to Home"
      className="-ml-2 grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
    >
      <IconChevronLeft className="size-5" />
    </a>
  )
}
