import type { Safeguard } from '@washi/domain'
import type {
  HostListCopy,
  HostListKind,
  LentKeyCopy,
  LentKeyTarget,
  LimitRow,
  SafeguardCopy,
} from './types'

/** Washi's own starting values, shown until the server sets its own (service constants). */
export const WASHI_DEFAULTS = { approvalMode: 'ask', dailyCapUsd: 25, turnCap: 200 } as const

export const HOST_LISTS: Record<HostListKind, HostListCopy> = {
  fetch: {
    title: 'Sites Washi may read',
    desc: 'From every workspace, without asking. Each workspace keeps its own list beside this one; http and private addresses never pass.',
    placeholder: 'api.example.com, *.example.com or *',
    empty: 'None yet: every fetch outside a workspace’s own list stops at the desk.',
    anyWarning:
      'With *, Washi may read any public https site from every workspace. It still asks first, unless the approval desk is off.',
  },
  embed: {
    title: 'Sites every page may embed',
    desc: 'Past the built-in providers, in every workspace on this server, beside each workspace’s own sites.',
    placeholder: 'docs.example.com, *.example.com or *',
    empty: 'None yet: only the built-ins and each workspace’s own sites play.',
    anyWarning:
      'With *, any https site plays in a page’s embed, shared links included — a page can frame whatever its author points it at.',
  },
  widget: {
    title: 'Widget network',
    desc: 'Sites a widget’s frame may reach, in every workspace, beside each workspace’s own. Empty, widgets have no network at all.',
    placeholder: 'api.example.com, *.example.com or *',
    empty: 'None: no widget reaches the network.',
    anyWarning:
      'With *, a widget may reach any https site — page code could send out anything its reader can read.',
  },
  workspaceWidget: {
    title: 'Widget network',
    desc: 'Sites this workspace’s widgets may reach, beside the server’s. Empty, they have no network at all.',
    placeholder: 'api.example.com, *.example.com or *',
    empty: 'None: widgets here reach only what the server lists.',
    anyWarning:
      'With *, a widget may reach any https site — page code could send out anything its reader can read.',
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

export const SAFEGUARD_COPY: Record<Safeguard, SafeguardCopy> = {
  privateNetwork: {
    label: 'Reach the private network',
    warning:
      'Washi’s fetches and link previews may reach private, loopback and link-local addresses: internal services and the cloud metadata endpoint (169.254.169.254) included.',
  },
  approveAll: {
    label: 'Approve everything that leaves',
    warning:
      'Fetches, web searches and actions never stop at the desk in any workspace; each workspace’s own approval setting no longer matters.',
  },
}

export const LIMIT_ROWS: LimitRow[] = [
  { limit: 'pageMemoryMb', label: 'Page code memory', unit: 'MB' },
  { limit: 'pageDrawMs', label: 'Page code time per draw', unit: 'ms' },
  { limit: 'pageBundleKb', label: 'Page code bundle', unit: 'KB' },
  { limit: 'widgetBundleKb', label: 'Widget bundle', unit: 'KB' },
  { limit: 'automationMemoryMb', label: 'Automation memory', unit: 'MB' },
  { limit: 'automationMs', label: 'Automation time per run', unit: 'ms' },
  { limit: 'formulaMs', label: 'Formula function time per call', unit: 'ms' },
  { limit: 'imageMb', label: 'Picture uploads', unit: 'MB' },
  { limit: 'videoMb', label: 'Video uploads', unit: 'MB' },
  { limit: 'audioMb', label: 'Audio uploads', unit: 'MB' },
  { limit: 'fileMb', label: 'Document uploads', unit: 'MB' },
]

export const PAGE_PACKAGES_COPY = {
  title: 'Page packages',
  desc: 'npm packages page code and widgets may import, beside date-fns, lodash-es and zod. Installed on this server with no install scripts; a page bundles what it imports.',
  placeholder: 'nanoid@5 or @scope/name@1.2.3',
  empty: 'None yet: pages import only Washi’s own libraries.',
} as const

/** How often the card asks again while a package is still installing. */
export const INSTALL_POLL_MS = 2000
