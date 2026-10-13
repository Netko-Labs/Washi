import { formatUsd } from '@/components/agent'
import { RoutinesSection } from '@/components/routines'
import { useSession } from '@/lib/auth'
import { greeting, longDate, type TodayViewProps, useToday } from './lib'
import { NeedsYou } from './needs-you'
import { TodayTurn } from './today-turn'

/**
 * The design's home: what happened, what needs you. Built from the transcript
 * and the desk — nothing here is invented, so an idle workspace says so.
 */
export function TodayView({ workspace, onOpenAgent }: TodayViewProps) {
  const { today, decide } = useToday()
  const { data: session } = useSession()
  const name = session?.user.name?.split(' ')[0]

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <p className="font-mono text-[12px] text-muted-foreground">
        {workspace.name} · {longDate()}
      </p>
      <h1 className="mt-1 font-black text-3xl tracking-tight">
        {greeting()}
        {name ? `, ${name}` : ''}
      </h1>
      {today && (
        <p className="mt-2 text-[14px] text-muted-foreground">
          {today.turns.length
            ? `Washi ran ${today.turns.length} ${today.turns.length === 1 ? 'turn' : 'turns'} in the last day.`
            : 'Nothing has happened here in the last day.'}{' '}
          <span className="font-mono text-[12px]">
            today {formatUsd(today.spend.costUsd)} of ${today.spend.capUsd}
            {today.spend.savedUsd > 0 && ` · saved ${formatUsd(today.spend.savedUsd)}`}
          </span>
        </p>
      )}

      {today && (
        <div className="mt-8 grid gap-8">
          <NeedsYou
            pending={today.pending}
            onDecide={(id, decision) => void decide(id, decision)}
          />

          <section>
            <h2 className="font-bold text-[14px]">What happened</h2>
            {today.turns.length > 0 ? (
              <ul className="mt-2 divide-y divide-border">
                {today.turns.map((turn) => (
                  <TodayTurn key={`${turn.sessionId}-${turn.at}`} turn={turn} />
                ))}
              </ul>
            ) : (
              <button
                type="button"
                onClick={onOpenAgent}
                className="mt-3 h-11 rounded-xl bg-primary px-5 font-bold text-[14px] text-primary-foreground"
              >
                Ask Washi for a page
              </button>
            )}
          </section>

          <RoutinesSection />
        </div>
      )}
    </div>
  )
}
