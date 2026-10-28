import { PaperProvider } from '@washi/paper'
import { AgentMascot, MascotDefs, Notice } from '@washi/ui'
import { useState } from 'react'
import { LearnLimits } from './learn-limits'
import { LearnNav } from './learn-nav'
import { LearnPrimitive } from './learn-primitive'
import { LearnRecipes } from './learn-recipes'
import { BASICS, learnGroups, useBookHost } from './lib'

/**
 * Every primitive a page is built from, live over an in-memory table: what it is for, how it
 * combines, what it cannot do. Read off the registry, so it never drifts from what the server takes.
 */
export function Learn() {
  const host = useBookHost()
  const [query, setQuery] = useState('')
  const groups = learnGroups(query)

  return (
    <PaperProvider host={host}>
      <MascotDefs />
      <header className="sticky top-0 z-20 flex h-12 items-center gap-2.5 border-border border-b bg-background/90 px-4 backdrop-blur md:px-8">
        <AgentMascot state="idle" size={22} />
        <span className="font-semibold text-[14px]">Washi · Page primitives</span>
      </header>
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-8 md:grid-cols-[200px_minmax(0,1fr)] md:px-8">
        <aside className="md:sticky md:top-20 md:max-h-[calc(100dvh-6rem)] md:self-start md:overflow-y-auto">
          <LearnNav groups={groups} query={query} onQuery={setQuery} />
        </aside>
        <main className="min-w-0 space-y-14">
          <section id="basics" className="scroll-mt-20 space-y-4">
            <h1 className="font-semibold text-[28px] tracking-tight">Page primitives</h1>
            <p className="max-w-[62ch] text-[15px] text-muted-foreground">
              Everything Washi builds a page from: each primitive drawn live, what it takes, how
              they combine and where they stop. Copy any example’s WSX into a page’s source.
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
          <section id="recipes" className="scroll-mt-20 space-y-5">
            <h2 className="font-semibold text-[22px]">Recipes</h2>
            <LearnRecipes />
          </section>
          <section id="limits" className="scroll-mt-20 space-y-5">
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
