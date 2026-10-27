import { IconBell } from '@tabler/icons-react'
import { AgentMascot } from '../mascot'
import { initials } from '../stores'
import { type InboxRowProps, whenLabel } from './lib'

const ROW =
  'relative flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent'

/** Avatar or mascot · who verb where · the second line · the time. Unread keeps the dot. */
export function InboxRow({ row, now }: InboxRowProps) {
  const body = (
    <>
      {row.unread && (
        <span className="absolute top-[18px] left-0 size-1.5 rounded-full bg-primary" />
      )}
      {row.kind === 'reminder' ? (
        <span
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-accent text-muted-foreground"
          aria-hidden
        >
          <IconBell className="size-4" />
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

  if (!row.onOpen) return <div className={ROW}>{body}</div>
  return (
    <button type="button" onClick={row.onOpen} className={ROW}>
      {body}
    </button>
  )
}
