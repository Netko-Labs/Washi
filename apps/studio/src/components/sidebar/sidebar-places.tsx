import { PLACES, PLACES_GAP, PLACES_INSET, type SidebarSectionProps, usePlaces } from './lib'

const EASE = 'duration-[260ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none'

/**
 * Home · Inbox · Chats · Routines on one track. The open place widens to its name and the pill
 * slides under it; the pill's slot is pure arithmetic — every other place is one icon wide.
 */
export function SidebarPlaces({ workspaceId, onNavigate }: SidebarSectionProps) {
  const { active, inboxCount, hrefOf, open } = usePlaces(workspaceId, onNavigate)
  const wide = active ?? 'home'
  const index = PLACES.findIndex((place) => place.id === wide)
  const step = `(var(--place) + ${PLACES_GAP}px)`

  return (
    <nav
      aria-label="Places"
      className="relative flex items-center rounded-xl bg-foreground/[0.045] [--place:36px] md:[--place:28px]"
      style={{ gap: PLACES_GAP, padding: PLACES_INSET }}
    >
      <span
        aria-hidden
        className={`absolute rounded-[9px] bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_var(--border)] transition-[left,opacity] ${EASE}`}
        style={{
          top: PLACES_INSET,
          bottom: PLACES_INSET,
          left: `calc(${PLACES_INSET}px + ${index} * ${step})`,
          width: `calc(100% - ${2 * PLACES_INSET}px - ${PLACES.length - 1} * ${step})`,
          opacity: active ? 1 : 0,
        }}
      />
      {PLACES.map(({ id, label, title, icon: Icon }) => {
        const isWide = id === wide
        return (
          <a
            key={id}
            href={hrefOf(id)}
            onClick={open(id)}
            aria-label={label}
            aria-current={id === active ? 'page' : undefined}
            title={title}
            className={`relative flex h-[var(--place)] min-w-[var(--place)] shrink-0 basis-[var(--place)] items-center rounded-[9px] transition-[flex-grow,color] ${EASE} ${
              id === active
                ? 'font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={{ flexGrow: isWide ? 1 : 0 }}
          >
            <span className="relative grid size-[var(--place)] shrink-0 place-items-center">
              <Icon className="size-[17px] md:size-[15px]" />
              {id === 'inbox' && inboxCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-primary px-1 font-semibold text-[9.5px] text-primary-foreground">
                  {inboxCount}
                </span>
              )}
            </span>
            <span
              className={`min-w-0 flex-1 overflow-hidden whitespace-nowrap pr-2 text-[14px] transition-opacity md:text-[13px] ${EASE}`}
              style={{ opacity: isWide ? 1 : 0 }}
            >
              {label}
            </span>
          </a>
        )
      })}
    </nav>
  )
}
