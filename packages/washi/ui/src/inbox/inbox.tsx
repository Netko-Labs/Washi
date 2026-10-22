import { AgentMascot } from '../mascot'
import { useAgentStore } from '../stores'
import { InboxChip } from './inbox-chip'
import { InboxRow } from './inbox-row'
import { type InboxFilter, type InboxProps, useInbox } from './lib'
import { NeedRow } from './need-row'

const EMPTY: Record<InboxFilter, string> = {
  all: 'Nothing in the last day.',
  needs: '',
  mentions: 'No mentions.',
  washi: 'Nothing from Washi in the last day.',
}

const LABEL =
  'px-3 pt-5 pb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]'

/** One list, one width, newest first, grouped by day; Needs you pinned on top, answered inline (D59). */
export function Inbox({ rows }: InboxProps) {
  const { approvals, groups, filter, setFilter, now, unread, mentions, hasMentions } =
    useInbox(rows)
  const count = approvals.length + unread
  const chips: InboxFilter[] = hasMentions
    ? ['all', 'needs', 'mentions', 'washi']
    : ['all', 'needs', 'washi']
  const showNeeds = filter === 'all' || filter === 'needs'

  return (
    <div className="flex-1 overflow-y-auto">
      <section className="mx-auto max-w-[720px] px-6 pt-9 pb-[60px]">
        <div className="flex items-baseline gap-2.5 px-3">
          <h1 className="font-semibold text-[22px] tracking-[-0.02em]">Inbox</h1>
          {count > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 font-mono font-semibold text-[11px] text-primary-foreground">
              {count}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 px-3">
          {chips.map((chip) => (
            <InboxChip
              key={chip}
              filter={chip}
              active={filter}
              count={
                chip === 'needs' ? approvals.length : chip === 'mentions' ? mentions : undefined
              }
              onPick={setFilter}
            />
          ))}
        </div>

        {showNeeds && approvals.length > 0 && (
          <>
            <div className={LABEL}>Needs you</div>
            <div className="space-y-1.5">
              {approvals.map((request) => (
                <NeedRow
                  key={request.id}
                  request={request}
                  now={now}
                  onDecide={(decision) =>
                    useAgentStore.getState().resolveApproval(request.id, decision)
                  }
                />
              ))}
            </div>
          </>
        )}
        {showNeeds && approvals.length === 0 && (
          <div className="mt-4 flex items-center gap-3 px-3 py-2.5 text-[13px]">
            <span className="grid size-7 place-items-center">
              <AgentMascot state="done" size={22} />
            </span>
            Nothing needs you.
          </div>
        )}

        {groups.map((group) => (
          <div key={group.label}>
            <div className={LABEL}>{group.label}</div>
            <div className="space-y-px">
              {group.rows.map((row) => (
                <InboxRow key={row.id} row={row} now={now} />
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && filter !== 'needs' && (
          <>
            {filter === 'all' && <div className={LABEL}>Today</div>}
            <p className="px-3 pt-4 text-[13px] text-muted-foreground">{EMPTY[filter]}</p>
          </>
        )}
      </section>
    </div>
  )
}
