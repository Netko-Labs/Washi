/** What `import { … } from 'washi'` lends a page (D100): its hooks, and `act` for a page verb. */
export const PAGE_HOOKS = [
  'useRows',
  'useRow',
  'useTable',
  'useInsert',
  'useUpdate',
  'useDelete',
  'useState',
  'usePageState',
  'useStored',
  'useInterval',
  'useNow',
  'usePage',
  'usePages',
  'useMembers',
  'useMe',
  'useNavigate',
  'act',
] as const

/** The libraries a page may import, besides `washi`, `washi/ui` and `page:<id>` — pure JS, vetted. */
export const PAGE_LIBRARIES = ['date-fns', 'lodash-es', 'zod'] as const

/** `page:` + a page id: that page's exports. */
export const PAGE_IMPORT = /^page:([a-z0-9-]{1,80})$/
