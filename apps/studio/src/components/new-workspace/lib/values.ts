import type { InviteRole, Starter, Step } from './types'

/** The flow's own three steps, then the one the workspace asks for itself (first run). */
export const STEPS: { id: Step | 'washi'; label: string }[] = [
  { id: 'name', label: 'Name it' },
  { id: 'start', label: 'Start it' },
  { id: 'invite', label: 'Invite people' },
  { id: 'washi', label: 'Wake Washi' },
]

export const STARTERS: { id: Starter; title: string; text: string; includes: string[] }[] = [
  {
    id: 'empty',
    title: 'Empty',
    text: 'A blank workspace. Start with a page, or ask Washi to make the first one.',
    includes: ['No pages', 'No tables'],
  },
  {
    id: 'team',
    title: 'Team space',
    text: 'Where a small team runs its week, ready to fill in.',
    includes: [
      'Projects and Issues tables',
      'Backlog and Roadmap',
      'Wiki, with How we work',
      'Ideas canvas',
      'Weekly review Washi refreshes at 17:00',
    ],
  },
]

export const ROLES: { id: InviteRole; label: string }[] = [
  { id: 'member', label: 'Member' },
  { id: 'admin', label: 'Admin' },
]

export const FIRST_INVITES = 3
