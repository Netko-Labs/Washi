import { PRIMITIVE_GROUPS } from '@washi/paper/registry'
import { GROUP_LABELS, useBookStore } from '@/components/shared/book'

export function Rail() {
  const book = useBookStore()
  const query = book.query.trim().toLowerCase()

  return (
    <aside className="flex min-h-0 flex-col border-border border-r bg-card">
      <div className="px-3 pt-3 pb-2">
        <input
          value={book.query}
          onChange={(event) => book.set({ query: event.target.value })}
          placeholder="Find a primitive"
          className="h-8 w-full rounded-[10px] border border-border bg-background px-2.5 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring"
        />
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {Object.entries(PRIMITIVE_GROUPS).map(([group, names]) => {
          const shown = names.filter(
            (name) => name !== 'Sheet' && (!query || name.toLowerCase().includes(query)),
          )
          if (shown.length === 0) return null
          return (
            <section key={group} className="mt-2">
              <h2 className="px-2 pt-2 pb-1 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
                {GROUP_LABELS[group] ?? group}
                <span className="ml-1.5 font-normal normal-case tracking-normal">
                  {shown.length}
                </span>
              </h2>
              <ul>
                {shown.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => book.pick(name)}
                      aria-current={book.primitive === name ? 'page' : undefined}
                      className={`flex h-7 w-full items-center rounded-[8px] px-2 text-left text-[13px] ${
                        book.primitive === name
                          ? 'bg-accent font-medium text-foreground'
                          : 'text-foreground/80 hover:bg-accent/60'
                      }`}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </nav>
    </aside>
  )
}
