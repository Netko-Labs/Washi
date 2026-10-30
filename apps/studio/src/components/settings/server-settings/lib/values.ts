import type { HostListCopy, HostListKind, LentKeyCopy, LentKeyTarget } from './types'

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

export const LENT_KEY_COPY: Record<LentKeyTarget, LentKeyCopy> = {
  exa: {
    title: 'Web search',
    desc: 'Workspaces without an Exa key of their own search the web on this one. A workspace’s own key always wins.',
    lent: 'Lent to every workspace',
    none: 'None',
    blurb: 'One Exa key for every workspace on this server, encrypted on it',
  },
  unsplash: {
    title: 'Unsplash photos',
    desc: 'Workspaces without an Unsplash Access Key of their own pick covers and pictures on this one. A workspace’s own key always wins.',
    lent: 'Lent to every workspace',
    none: 'None',
    blurb: 'One Unsplash Access Key for every workspace on this server, encrypted on it',
  },
}

export const PAGE_PACKAGES_COPY = {
  title: 'Page packages',
  desc: 'npm packages page code and widgets may import, beside date-fns, lodash-es and zod. Installed on this server with no install scripts; a page bundles what it imports.',
  placeholder: 'nanoid@5 or @scope/name@1.2.3',
  empty: 'None yet: pages import only Washi’s own libraries.',
} as const

/** How often the card asks again while a package is still installing. */
export const INSTALL_POLL_MS = 2000
