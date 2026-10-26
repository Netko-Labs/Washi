import type { Audience } from './types'

export const AUDIENCES: { id: Audience; title: string; text: string }[] = [
  {
    id: 'shared',
    title: 'Everyone in the workspace',
    text: 'Every member can open it, and Washi when they ask.',
  },
  {
    id: 'private',
    title: 'Only people you choose',
    text: 'Them and the workspace owner. Pages inside it follow.',
  },
  {
    id: 'public',
    title: 'Anyone with the link',
    text: 'Read-only, no sign-in. Redacted parts never leave the server.',
  },
]
