import { ACTIVITY, REVIEWS } from '@/components/dashboard/review-data'
import { AgentMascot } from '@/components/mascot/AgentMascot'
import { useViewStore } from '@/stores/view/view-store'

/** Inbox view (Washi.dc.html rev 2): review queue + activity feed in one place. */
export function Inbox() {
  const { dismissedReviews, dismissReview } = useViewStore()
  const pending = REVIEWS.filter((review) => !dismissedReviews.includes(review.id))

  return (
    <div className="flex-1 overflow-y-auto">
      <section className="mx-auto max-w-[680px] px-10 pt-11 pb-[60px]">
        <h1 className="font-semibold text-[24px] tracking-[-0.02em]">Inbox</h1>
        <p className="mb-[22px] text-muted-foreground">
          Everything Washi wants you to look at, in one queue.
        </p>

        <div className="mb-[26px] overflow-hidden rounded-[14px] border border-border bg-card">
          {pending.map((review) => (
            <div
              key={review.id}
              className="flex items-center gap-3 border-border border-b px-4 py-3 last:border-0"
            >
              <AgentMascot state="suggesting" size={22} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-[13px]">{review.title}</div>
                <div className="text-[11.5px] text-muted-foreground">{review.meta}</div>
              </div>
              <button
                type="button"
                onClick={() => dismissReview(review.id)}
                className="h-[26px] rounded-lg border border-border bg-background px-2.5 text-[12px] hover:bg-accent"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => dismissReview(review.id)}
                className="h-[26px] rounded-lg bg-primary px-2.5 font-medium text-[12px] text-primary-foreground"
              >
                Review
              </button>
            </div>
          ))}
          {pending.length === 0 && (
            <div className="flex items-center gap-2.5 p-4 text-[13px] text-muted-foreground">
              <AgentMascot state="done" size={22} />
              Inbox zero — Washi has nothing waiting on you.
            </div>
          )}
        </div>

        <div className="mb-2.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
          Earlier
        </div>
        <div className="flex flex-col gap-3.5 pl-1">
          {ACTIVITY.map((item) => (
            <div key={item.text} className="flex gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-agent" />
              <div>
                <div className="text-[13px] leading-normal">{item.text}</div>
                <div className="text-[11px] text-muted-foreground">{item.when}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
