import { usd } from '../agent/lib'
import { ApprovalCard } from '../approval'
import { byRecent, relativeMs, relativeTime } from '../page-time'
import { SheetIcon } from '../sheet-icon'
import { useSheetsStore, useViewStore } from '../stores'
import { useToday } from '../today'
import { StartHere } from './start-here'

// hlc = zero-padded ms wall clock, then counter, then device id
function greeting(hour = new Date().getHours()): string {
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const { sheets } = useSheetsStore()
  const { openTab, identity } = useViewStore()
  const { today, decide } = useToday()
  const turns = today?.turns ?? []
  const pending = today?.pending ?? []
  const pages = sheets.filter((sheet) => !sheet.rowOf)
  const recent = byRecent(sheets).slice(0, 3)
  const firstName = identity.name.trim().split(/\s+/)[0] || 'there'
  const onPlan = (today?.spend.savedUsd ?? 0) > 0

  const openSheet = (id: string) => {
    openTab(`note:${id}`)
  }

  return (
    <div className="flex-1 overflow-y-auto overscroll-y-none">
      <section className="mx-auto max-w-[940px] px-10 pt-11 pb-[60px]">
        <h1 className="mb-1 font-semibold text-[28px] tracking-[-0.02em]">
          {greeting()}, {firstName}
        </h1>
        <p className="mb-7 text-muted-foreground">
          {turns.length
            ? `Washi ran ${turns.length} ${turns.length === 1 ? 'turn' : 'turns'} in the last day.`
            : 'Nothing has happened here in the last day.'}
          {today &&
            today.spend.savedUsd > 0 &&
            ` Your Claude plan covered ${usd(today.spend.savedUsd)} of it.`}
        </p>

        {pages.length === 0 && <StartHere />}

        <div className="mb-[30px] grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
          <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="mb-1.5 text-muted-foreground text-xs">Pages</div>
            <div className="font-semibold text-[26px] tracking-[-0.02em]">{pages.length}</div>
          </div>
          <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="mb-1.5 text-muted-foreground text-xs">Needs you</div>
            <div className="font-semibold text-[26px] text-agent tracking-[-0.02em]">
              {pending.length}
            </div>
          </div>
          <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="mb-1.5 text-muted-foreground text-xs">Turns today</div>
            <div className="font-semibold text-[26px] tracking-[-0.02em]">
              {today?.spend.turns ?? 0}
            </div>
          </div>
          <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="mb-1.5 text-muted-foreground text-xs">
              {onPlan ? 'Saved by your plan' : 'Spent today'}
            </div>
            <div className="font-mono font-semibold text-[22px] tracking-[-0.02em]">
              {usd((onPlan ? today?.spend.savedUsd : today?.spend.costUsd) ?? 0)}
            </div>
          </div>
        </div>

        {pending.length > 0 && (
          <div className="mb-[30px] overflow-hidden rounded-[14px] border border-border bg-card">
            <div className="flex items-center gap-2 border-border border-b px-[18px] py-3">
              <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
                Needs you
              </span>
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-agent px-[5px] font-semibold text-[11px] text-white">
                {pending.length}
              </span>
            </div>
            <div className="grid gap-2.5 p-3">
              {pending.map((request) => (
                <ApprovalCard
                  key={request.id}
                  toolName={request.toolName}
                  input={request.input}
                  onDecide={(decision) => decide(request.id, decision)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[26px]">
          <div>
            <div className="mb-2.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
              Recent pages
            </div>
            <div className="flex flex-col gap-2">
              {recent.length === 0 && (
                <p className="text-[13px] text-muted-foreground">No pages yet.</p>
              )}
              {recent.map((sheet) => (
                <button
                  key={sheet.id}
                  type="button"
                  onClick={() => openSheet(sheet.id)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-[15px] py-[13px] text-left hover:bg-accent"
                >
                  <SheetIcon name={sheet.icon} className="size-[15px] text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{sheet.title}</span>
                    <span className="text-muted-foreground text-xs">
                      Edited {relativeTime(sheet.hlcUpdated)}
                    </span>
                  </span>
                  {sheet.tags[0] && (
                    <span className="inline-flex h-5 items-center rounded-md bg-muted px-2 font-medium text-[11px]">
                      {sheet.tags[0]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
              Agent activity
            </div>
            <div className="flex flex-col gap-3.5 pl-1">
              {turns.length === 0 && (
                <p className="text-[13px] text-muted-foreground">No turns in the last day.</p>
              )}
              {turns.slice(0, 6).map((turn) => (
                <div key={`${turn.sessionId}-${turn.at}`} className="flex gap-2.5">
                  <span className="mt-1.5 size-1.5 flex-none rounded-full bg-agent" />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] leading-[1.5]">
                      {turn.prompt || turn.sessionTitle}
                    </div>
                    <div className="text-[11.5px] text-muted-foreground">
                      {relativeMs(turn.at)}
                      {turn.receipt.stopReason === 'error' &&
                        ` · ${turn.receipt.error ?? 'failed'}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
