import type { InviteRole } from './types'

export const INVITE_ROLES: { id: InviteRole; label: string }[] = [
  { id: 'member', label: 'Member' },
  { id: 'admin', label: 'Admin' },
]

export const ROLE_LEGEND =
  'Owners and admins manage keys, people and workspace-wide switches; members write pages and tables.'

export const ROLE_PILL: Record<string, string> = {
  owner: 'bg-primary/12 text-primary',
  admin: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  member: 'bg-accent text-muted-foreground',
}
