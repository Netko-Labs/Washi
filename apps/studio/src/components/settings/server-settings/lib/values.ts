import type { HostListCopy, HostListKind } from './types'

/** Washi's own starting values, shown until the server sets its own (service constants). */
export const WASHI_DEFAULTS = { approvalMode: 'ask', dailyCapUsd: 25, turnCap: 200 } as const

export const HOST_LISTS: Record<HostListKind, HostListCopy> = {
  fetch: {
    title: 'Sites Washi may read',
    desc: 'From every workspace, without asking. Each workspace keeps its own list beside this one; http and private addresses never pass.',
    placeholder: 'api.example.com or *.example.com',
    empty: 'None yet: every fetch outside a workspace’s own list stops at the desk.',
  },
  embed: {
    title: 'Sites every page may embed',
    desc: 'Past the built-in providers, in every workspace on this server, beside each workspace’s own sites.',
    placeholder: 'docs.example.com',
    empty: 'None yet: only the built-ins and each workspace’s own sites play.',
  },
}

export const SEARCH_KEY_COPY = {
  title: 'Web search',
  desc: 'Workspaces without an Exa key of their own search the web on this one. A workspace’s own key always wins.',
  lent: 'Lent to every workspace',
  none: 'None',
  blurb: 'One Exa key for every workspace on this server, encrypted on it',
} as const
