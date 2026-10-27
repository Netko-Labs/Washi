import type { SettingsNavProps } from './lib'

/** Grouped on the left from `md` up; one scrolling row of chips on a phone. */
export function SettingsNav({ groups, current, onTab }: SettingsNavProps) {
  return (
    <nav
      aria-label="Settings"
      className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-1 md:sticky md:top-0 md:mx-0 md:w-[200px] md:shrink-0 md:flex-col md:gap-0 md:self-start md:overflow-visible md:px-0 md:pb-0"
    >
      {groups.map((group) => (
        <div key={group.label} className="flex gap-1 md:mb-4 md:flex-col md:gap-px">
          <div className="hidden px-2.5 pb-1 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.06em] md:block">
            {group.label}
          </div>
          {group.sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onTab(key)}
              aria-current={key === current ? 'page' : undefined}
              className={`flex h-8 shrink-0 items-center gap-2 rounded-lg px-2.5 text-[13px] ${
                key === current
                  ? 'bg-accent font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      ))}
    </nav>
  )
}
