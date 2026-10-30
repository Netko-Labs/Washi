import { useState } from 'react'
import { InviteRow } from './invite-row'
import {
  INVITE_ROLES,
  type InviteRole,
  type PeopleSectionProps,
  ROLE_LEGEND,
  usePeople,
} from './lib'
import { RolePill } from './role-pill'

/**
 * No email server is assumed: an invitation is a link someone pastes into chat.
 * Only the invited address can accept it, so the link carries no extra power.
 */
export function PeopleSection({ workspaceId }: PeopleSectionProps) {
  const { members, invitations, error, invite, cancel } = usePeople(workspaceId)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('member')

  return (
    <section>
      <h2 className="font-semibold text-[15px]">People</h2>
      <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed">
        Invite someone by email, then send them the link. They sign in with that address and they're
        in.
      </p>
      <p className="mt-1 text-[12.5px] text-muted-foreground leading-relaxed">{ROLE_LEGEND}</p>

      <ul className="mt-4 divide-y divide-border">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-3 py-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent font-semibold text-[12px]">
              {member.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px]">{member.name}</span>
              <span className="block truncate text-[12px] text-muted-foreground">
                {member.email}
              </span>
            </span>
            <RolePill role={member.role} />
          </li>
        ))}
        {invitations.map((invitation) => (
          <InviteRow key={invitation.id} invitation={invitation} onCancel={cancel} />
        ))}
      </ul>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          const address = email.trim()
          if (!address) return
          void invite(address, role).then((id) => id && setEmail(''))
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="teammate@example.com"
          aria-label="Email to invite"
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-[14px] outline-none focus-visible:border-primary"
        />
        <select
          value={role}
          aria-label="Role"
          onChange={(event) => setRole(event.target.value as InviteRole)}
          className="h-11 shrink-0 rounded-xl border border-border bg-card px-2 text-[13.5px]"
        >
          {INVITE_ROLES.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {choice.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!email.trim()}
          className="h-11 shrink-0 rounded-xl border border-border px-4 font-semibold text-[13.5px] hover:bg-accent disabled:opacity-50"
        >
          Invite
        </button>
      </form>
      {error && <p className="mt-3 text-[13px] text-destructive">{error}</p>}
    </section>
  )
}
