import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useState } from 'react'
import { inviteLink } from '@/components/people'
import type { InviteSentListProps } from './lib'

/** No email leaves the server: each invitation is a link only its address can accept. */
export function InviteSentList({ sent }: InviteSentListProps) {
  const [copied, setCopied] = useState<string | null>(null)

  return (
    <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
      {sent.map((invite) => (
        <li key={invite.id} className="flex items-center gap-2 px-3 py-2">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px]">{invite.email}</span>
            <span className="block font-mono text-[11px] text-muted-foreground">
              invited · {invite.role}
            </span>
          </span>
          <button
            type="button"
            onClick={() =>
              void navigator.clipboard
                .writeText(inviteLink(invite.id))
                .then(() => setCopied(invite.id))
            }
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] hover:bg-accent"
          >
            {copied === invite.id ? (
              <IconCheck className="size-3.5" />
            ) : (
              <IconCopy className="size-3.5" />
            )}
            {copied === invite.id ? 'Copied' : 'Copy link'}
          </button>
        </li>
      ))}
    </ul>
  )
}
