import { IconFileText } from '@tabler/icons-react'
import { useSheetsStore } from '@/stores/sheets/sheets-store'
import { useViewStore } from '@/stores/view/view-store'

const REVIEWS = [
  { title: 'Nullbyte terminal — scrollback claim', meta: 'Suggested edit · 4 min ago' },
  { title: 'Hearth recipes — contrast fix on labels', meta: 'Draft awaiting review · 2 min ago' },
  {
    title: 'SLAB marketplace — token conflicts',
    meta: 'Scheduled run flagged 3 components · 06:00',
  },
]

const ACTIVITY = [
  { text: 'Suggested a scrollback rewrite in Nullbyte', when: '4 min ago' },
  { text: 'Flagged a contrast failure in Hearth labels', when: '2 hours ago' },
  { text: 'Scheduled run: token conflict audit on SLAB', when: '06:00' },
  { text: 'Linked 6 research pages as sources', when: 'yesterday' },
]

// hlc = zero-padded ms wall clock, then counter, then device id
function relativeTime(hlc: string): string {
  const ms = Number(hlc.slice(0, 14))
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
  const { sheets, select } = useSheetsStore()
  const setView = useViewStore((state) => state.setView)
  const recent = sheets.slice(0, 3)

  const openSheet = (id: string) => {
    select(id)
    setView('note')
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <section className="mx-auto max-w-[940px] px-10 pt-11 pb-[60px]">
        <h1 className="mb-1 font-semibold text-[28px] tracking-[-0.02em]">Good morning, Mira</h1>
        <p className="mb-7 text-muted-foreground">
          Washi made 7 edits across 3 pages while you were away.
        </p>

        <div className="mb-[30px] grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
          <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="mb-1.5 text-muted-foreground text-xs">Pages</div>
            <div className="font-semibold text-[26px] tracking-[-0.02em]">{sheets.length}</div>
          </div>
          <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="mb-1.5 text-muted-foreground text-xs">Awaiting review</div>
            <div className="font-semibold text-[26px] text-agent tracking-[-0.02em]">4</div>
          </div>
          <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="mb-1.5 text-muted-foreground text-xs">Written by agents</div>
            <div className="font-semibold text-[26px] tracking-[-0.02em]">31%</div>
          </div>
          <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="mb-1.5 text-muted-foreground text-xs">Writing streak</div>
            <div className="font-semibold text-[26px] tracking-[-0.02em]">
              12
              <span className="font-medium text-[13px] text-muted-foreground"> days</span>
            </div>
          </div>
        </div>

        <div className="mb-[30px] overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="flex items-center gap-2 border-border border-b px-[18px] py-3">
            <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
              Needs your review
            </span>
            <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-agent px-[5px] font-semibold text-[11px] text-white">
              {REVIEWS.length}
            </span>
          </div>
          {REVIEWS.map((review) => (
            <div
              key={review.title}
              className="flex flex-wrap items-center gap-2.5 border-border border-b px-[18px] py-[11px]"
            >
              <IconFileText className="size-[15px]" />
              <span className="min-w-0 flex-[1_1_240px]">
                <span className="block truncate font-medium text-[13px]">{review.title}</span>
                <span className="block text-[11.5px] text-muted-foreground">{review.meta}</span>
              </span>
              <span className="flex flex-none gap-1.5">
                <button
                  type="button"
                  className="h-[26px] rounded-lg border border-border bg-background px-2.5 text-xs hover:bg-accent"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  className="h-[26px] rounded-lg bg-primary px-2.5 font-medium text-primary-foreground text-xs hover:opacity-90"
                >
                  Review
                </button>
              </span>
            </div>
          ))}
        </div>

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
                  {sheet.icon ? (
                    <span className="text-[13px]">{sheet.icon}</span>
                  ) : (
                    <IconFileText className="size-[15px] text-muted-foreground" />
                  )}
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
              {ACTIVITY.map((item) => (
                <div key={item.text} className="flex gap-2.5">
                  <span className="mt-1.5 size-1.5 flex-none rounded-full bg-agent" />
                  <div>
                    <div className="text-[13px] leading-[1.5]">{item.text}</div>
                    <div className="text-[11px] text-muted-foreground">{item.when}</div>
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
