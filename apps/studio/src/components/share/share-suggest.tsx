import { IconInbox } from '@tabler/icons-react'
import type { ShareSuggestProps } from './lib'

/** D120: a public page's adds may reach the Inbox as suggestions; off, the link adds nothing. */
export function ShareSuggest({ value, busy, onChange }: ShareSuggestProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={busy}
      onClick={() => onChange(!value)}
      className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-accent disabled:opacity-60"
    >
      <IconInbox
        className={`mt-0.5 size-4 shrink-0 ${value ? 'text-primary' : 'text-muted-foreground'}`}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[13px]">Visitors can suggest rows</span>
        <span className="block text-[12px] text-muted-foreground leading-snug">
          The page's forms, calendars and boards take a name and an email; each row waits in the
          Inbox until a member approves it. Redacted columns stay unreadable.
        </span>
      </span>
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          value ? 'justify-end bg-primary' : 'justify-start bg-muted'
        }`}
      >
        <span className="size-4 rounded-full bg-background shadow-sm" />
      </span>
    </button>
  )
}
