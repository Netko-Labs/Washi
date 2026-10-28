import { pageLimits } from '@washi/paper/book'

/** What a page cannot do, with the numbers the validator holds it to. */
export function LearnLimits() {
  return (
    <dl className="divide-y divide-border rounded-xl border border-border bg-card">
      {pageLimits().map((limit) => (
        <div
          key={limit.title}
          className="grid gap-1 px-4 py-3 md:grid-cols-[180px_minmax(0,1fr)] md:gap-4"
        >
          <dt className="font-semibold text-[13.5px]">{limit.title}</dt>
          <dd className="text-[13.5px] text-muted-foreground leading-relaxed">{limit.detail}</dd>
        </div>
      ))}
    </dl>
  )
}
