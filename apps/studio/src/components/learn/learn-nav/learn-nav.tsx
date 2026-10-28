import { anchorOf, type LearnNavProps, NAV_LINK, SECTIONS } from '../lib'

export function LearnNav({ groups, query, onQuery }: LearnNavProps) {
  return (
    <nav aria-label="Primitives" className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(event) => onQuery(event.currentTarget.value)}
        placeholder="Find a primitive"
        aria-label="Find a primitive"
        className="h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px] outline-none focus:border-ring"
      />
      <ul>
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className={NAV_LINK}>
              {section.label}
            </a>
          </li>
        ))}
      </ul>
      {groups.map((group) => (
        <div key={group.id}>
          <p className="px-2 pb-1 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
            {group.label}
          </p>
          <ul>
            {group.names.map((name) => (
              <li key={name}>
                <a href={`#${anchorOf(name)}`} className={NAV_LINK}>
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
