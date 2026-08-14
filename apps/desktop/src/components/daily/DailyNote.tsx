import { useState } from 'react'
import { AgentMascot } from '@/components/mascot/AgentMascot'

const ACTION_ITEMS = [
  'Send revised label contrast pass by Friday',
  'Confirm seasonal menu photography budget',
  'Hearth wants the recipe importer in the beta',
]

/** Daily note view (Washi.dc.html rev 2). Static copy; pull interaction is local. */
export function DailyNote() {
  const [pulled, setPulled] = useState(false)
  const [declined, setDeclined] = useState(false)
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex-1 overflow-y-auto">
      <article className="mx-auto max-w-[700px] px-10 pt-14 pb-20">
        <div className="mb-1.5 flex items-center gap-2.5">
          <h1 className="font-semibold text-[27px] tracking-[-0.02em]">{today}</h1>
          <span className="flex h-[22px] items-center rounded-full bg-muted px-2.5 font-medium text-[11.5px] text-muted-foreground">
            12-day streak
          </span>
        </div>
        <p className="mb-6 text-[12px] text-muted-foreground">
          Daily note · only you and Washi can see this
        </p>
        <p className="leading-[1.75]">
          Reviewed the scrollback suggestion first thing — accepted with the settings pointer. Need
          to close the radius token question with SLAB before Friday.
        </p>

        {!pulled && !declined && (
          <div className="my-4 flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3">
            <AgentMascot state="idle" size={30} />
            <p className="flex-1 text-[13px] leading-relaxed">
              Yesterday you met with the Hearth client — want me to pull the action items into
              today's note?
            </p>
            <button
              type="button"
              onClick={() => setDeclined(true)}
              className="h-[26px] shrink-0 rounded-lg border border-border bg-background px-2.5 text-[12px] hover:bg-accent"
            >
              No
            </button>
            <button
              type="button"
              onClick={() => setPulled(true)}
              className="h-[26px] shrink-0 rounded-lg bg-primary px-2.5 font-medium text-[12px] text-primary-foreground"
            >
              Yes, pull them in
            </button>
          </div>
        )}

        {pulled && (
          <div className="my-4">
            <div className="mb-1.5 flex items-center gap-[7px] text-[11px] text-muted-foreground">
              <AgentMascot state="writing" size={15} />
              Pulled by Washi from Client sync — Hearth
            </div>
            <ul className="ml-0.5 list-disc border-agent border-l-2 pl-[26px] leading-[1.8]">
              {ACTION_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 text-muted-foreground">What else happened today…</p>
      </article>
    </div>
  )
}
