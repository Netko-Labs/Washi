import { IconFileText } from '@tabler/icons-react'
import { SheetIcon, useToday } from '@washi/ui'
import { receiptLine, usd } from '@/components/agent/lib'
import { useSheetsStore } from '@/stores/sheets/sheets-store'
import { useViewStore } from '@/stores/view/view-store'

// hlc = zero-padded ms wall clock, then counter, then device id
function greeting(hour = new Date().getHours()): string {
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function relativeTime(hlc: string): string {
  return relativeMs(Number(hlc.slice(0, 14)))
}

function relativeMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'recently'
  const minutes = Math.floor((Date.now() - ms) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

export function Dashboard() {
  const { sheets } = useSheetsStore()
  const { openTab, identity } = useViewStore()
  const { today, decide } = useToday()
  const turns = today?.turns ?? []
  const pending = today?.pending ?? []
  const recent = sheets.slice(0, 3)
  const firstName = identity.name.trim().split(/\s+/)[0] || 'there'

  const openSheet = (id: string) => {
    openTab(`note:${id}`)
  }

  return (
    <div className="flex-1 overflow-y-auto">
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

        <div className="mb-[30px] grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
          <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="mb-1.5 text-muted-foreground text-xs">Pages</div>
            <div className="font-semibold text-[26px] tracking-[-0.02em]">{sheets.length}</div>
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
            <div className="mb-1.5 text-muted-foreground text-xs">Saved by your plan</div>
            <div className="font-mono font-semibold text-[22px] tracking-[-0.02em]">
              {usd(today?.spend.savedUsd ?? 0)}
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
            {pending.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center gap-2.5 border-border border-b px-[18px] py-[11px]"
              >
                <IconFileText className="size-[15px]" />
                <span className="min-w-0 flex-[1_1_240px]">
                  <span className="block truncate font-medium text-[13px]">
                    Washi wants to run <span className="font-mono">{request.toolName}</span>
                  </span>
                  <span className="block truncate font-mono text-[11.5px] text-muted-foreground">
                    {JSON.stringify(request.input ?? {}).slice(0, 120)}
                  </span>
                </span>
                <span className="flex flex-none gap-1.5">
                  <button
                    type="button"
                    onClick={() => void decide(request.id, 'reject_once')}
                    className="h-[26px] rounded-lg border border-border bg-background px-2.5 text-xs hover:bg-accent"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => void decide(request.id, 'allow_once')}
                    className="h-[26px] rounded-lg bg-primary px-2.5 font-medium text-primary-foreground text-xs hover:opacity-90"
                  >
                    Accept
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[26px]">
          <div>
            <div className="mb-2.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
              Recent pages
            </div>
            <div className="flex flex-col gap-2">
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
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {relativeMs(turn.at)} ·{' '}
                      {turn.receipt.stopReason === 'error'
                        ? (turn.receipt.error ?? 'failed')
                        : receiptLine(turn.receipt)}
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
