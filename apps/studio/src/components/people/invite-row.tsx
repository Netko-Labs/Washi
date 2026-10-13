import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useState } from 'react'
import { type InviteRowProps, inviteLink } from './lib'

export function InviteRow({ invitation, onCancel }: InviteRowProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(inviteLink(invitation.id))
    setCopied(true)
  }

  return (
    <li className="flex items-center gap-2 py-2">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px]">{invitation.email}</span>
        <span className="block font-mono text-[11px] text-muted-foreground">
          invited · {invitation.role} · expires {invitation.expiresAt.slice(0, 10)}
        </span>
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        className="flex h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] hover:bg-accent"
      >
        {copied ? <IconCheck className="size-3.5" /> : <IconCopy className="size-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
      <button
        type="button"
        onClick={() => onCancel(invitation.id)}
        className="h-11 rounded-lg px-3 text-[12.5px] text-muted-foreground hover:bg-accent"
      >
        Cancel
      </button>
    </li>
  )
}
