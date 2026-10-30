import { IconBell, IconInbox } from '@tabler/icons-react'
import { AgentMascot } from '../mascot'
import { initials } from '../stores'
import { InboxRowActions } from './inbox-row-actions'
import { type InboxRowProps, whenLabel } from './lib'

const ROW =
  'relative flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent'

/**
 * Avatar or mascot · who verb where · the second line · the time. Unread keeps the dot; a row's
 * own presses (a suggestion's Approve, Decline) sit under it, outside the row's own button.
 */
export function InboxRow({ row, now }: InboxRowProps) {
  const body = (
    <>
      {row.unread && (
        <span className="absolute top-[18px] left-0 size-1.5 rounded-full bg-primary" />
      )}
      {row.kind === 'reminder' || row.kind === 'suggestion' ? (
        <span
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-accent text-muted-foreground"
          aria-hidden
        >
          {row.kind === 'reminder' ? (
            <IconBell className="size-4" />
          ) : (
            <IconInbox className="size-4" />
          )}
        </span>
      ) : row.who ? (
        <span
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary font-semibold text-[10.5px] text-primary-foreground"
          aria-hidden
        >
          {initials(row.who)}
        </span>
      ) : (
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center">
          <AgentMascot state="done" size={22} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] leading-snug">
          <span className="font-semibold">{row.who ?? 'Washi'}</span> {row.verb}
          {row.where && <span className="font-semibold"> {row.where}</span>}
        </span>
        {row.detail && (
          <span
            className={`block text-muted-foreground ${
              row.mono ? 'truncate font-mono text-[11px]' : 'line-clamp-2 text-[12.5px]'
            }`}
          >
            {row.detail}
          </span>
        )}
      </span>
      <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground">
        {whenLabel(row.at, now)}
      </span>
    </>
  )

  const main = row.onOpen ? (
    <button type="button" onClick={row.onOpen} className={ROW}>
      {body}
    </button>
  ) : (
    <div className={ROW}>{body}</div>
  )
  if (!row.actions?.length) return main
  return (
    <div>
      {main}
      <InboxRowActions actions={row.actions} />
    </div>
  )
}
