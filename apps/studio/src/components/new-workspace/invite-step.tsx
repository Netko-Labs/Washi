import { IconPlus, IconX } from '@tabler/icons-react'
import { InviteSentList } from './invite-sent-list'
import { type InviteRole, type InviteStepProps, ROLES, useInvites } from './lib'

export function InviteStep({ workspace, onDone }: InviteStepProps) {
  const invites = useInvites(workspace.id)
  const hasDrafts = invites.drafts.some((row) => row.email.trim())

  return (
    <div>
      <h1 className="font-semibold text-[26px] tracking-[-0.02em]">Invite your team</h1>
      <p className="mt-2 max-w-md text-[14px] text-muted-foreground leading-relaxed">
        Washi sends no email. Each invite is a link only that address can accept: copy it to them
        however you talk. Admins can invite people and set Washi up too.
      </p>

      <form
        className="mt-8 grid gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void invites.send()
        }}
      >
        {invites.drafts.map((row) => (
          <div key={row.key} className="flex gap-2">
            <input
              type="email"
              value={row.email}
              onChange={(event) => invites.edit(row.key, { email: event.target.value })}
              placeholder="name@team.com"
              aria-label="Email"
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-[14px] outline-none focus-visible:border-primary"
            />
            <select
              value={row.role}
              aria-label="Role"
              onChange={(event) =>
                invites.edit(row.key, { role: event.target.value as InviteRole })
              }
              className="h-11 rounded-xl border border-border bg-card px-2 text-[13.5px]"
            >
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Remove this row"
              onClick={() => invites.remove(row.key)}
              className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-accent"
            >
              <IconX className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={invites.add}
          className="flex h-9 items-center gap-1.5 justify-self-start rounded-lg px-2 text-[13px] text-muted-foreground hover:bg-accent"
        >
          <IconPlus className="size-4" />
          Add another
        </button>

        {invites.error && <p className="text-[13px] text-destructive">{invites.error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={invites.busy || !hasDrafts}
            className="h-11 rounded-xl border border-border bg-card px-5 font-semibold text-[14px] hover:bg-accent disabled:opacity-50"
          >
            {invites.busy ? 'Inviting…' : 'Create invites'}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="h-11 rounded-xl bg-primary px-6 font-semibold text-[14px] text-primary-foreground"
          >
            {invites.sent.length > 0 ? `Open ${workspace.name}` : 'Skip · open the workspace'}
          </button>
        </div>
      </form>

      {invites.sent.length > 0 && <InviteSentList sent={invites.sent} />}
    </div>
  )
}
