import { PaperProvider } from '@washi/paper'
import { AgentMascot, MascotDefs, Notice } from '@washi/ui'
import { useState } from 'react'
import { LearnLimits } from './learn-limits'
import { LearnNav } from './learn-nav'
import { LearnPrimitive } from './learn-primitive'
import { LearnRecipes } from './learn-recipes'
import { ANCHOR_OFFSET, BASICS, learnGroups, learnRecipes, useBookHost } from './lib'

/**
 * Every primitive a page is built from, live over an in-memory table: what it is for, how it
 * combines, what it cannot do. Read off the registry, so it never drifts from what the server takes.
 */
export function Learn() {
  const host = useBookHost()
  const [query, setQuery] = useState('')
  const groups = learnGroups(query)
  const recipes = learnRecipes(query)

  return (
    <PaperProvider host={host}>
      <MascotDefs />
      <header className="sticky top-0 z-20 flex h-12 items-center gap-2.5 border-border border-b bg-background/90 px-4 backdrop-blur md:px-8">
        <AgentMascot state="idle" size={22} />
        <span className="font-semibold text-[14px]">Washi · Page primitives</span>
      </header>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-4 pb-8 md:grid md:grid-cols-[200px_minmax(0,1fr)] md:gap-10 md:px-8 md:py-8">
        <aside className="sticky top-12 z-10 -mx-4 border-border border-b bg-background/95 px-4 py-2 backdrop-blur md:top-20 md:mx-0 md:max-h-[calc(100dvh-6rem)] md:self-start md:overflow-y-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <LearnNav groups={groups} recipes={recipes} query={query} onQuery={setQuery} />
        </aside>
        <main className="min-w-0 space-y-14">
          <section id="basics" className={`${ANCHOR_OFFSET} space-y-4`}>
            <h1 className="font-semibold text-[28px] tracking-tight">Page primitives</h1>
            <p className="max-w-[62ch] text-[15px] text-muted-foreground">
              Everything Washi builds a page from: each primitive drawn live, what it takes, how
              they combine and where they stop. Copy any example’s WSX into a page’s source.
            </p>
            <p className="max-w-[62ch] text-[15px] text-muted-foreground">
              To see a page’s own markup, open it and press Edit, then{' '}
              <code className="font-mono text-[13px]">&lt;/&gt;</code> — or ⋯ → Edit source. It is
              the same WSX these examples use.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {BASICS.map((basic) => (
                <div key={basic.title} className="rounded-xl border border-border bg-card p-4">
                  <h2 className="font-semibold text-[14px]">{basic.title}</h2>
                  <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed">
                    {basic.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section id="recipes" className={`${ANCHOR_OFFSET} space-y-5`}>
            <h2 className="font-semibold text-[22px]">Recipes</h2>
            <LearnRecipes recipes={recipes} query={query} />
          </section>
          <section id="limits" className={`${ANCHOR_OFFSET} space-y-5`}>
            <h2 className="font-semibold text-[22px]">Limits</h2>
            <LearnLimits />
          </section>
          {groups.map((group) => (
            <section key={group.id} className="space-y-10">
              <h2 className="border-border border-b pb-2 font-semibold text-[22px]">
                {group.label}
              </h2>
              {group.names.map((name) => (
                <LearnPrimitive key={name} name={name} />
              ))}
            </section>
          ))}
        </main>
      </div>
      <Notice />
    </PaperProvider>
  )
}
