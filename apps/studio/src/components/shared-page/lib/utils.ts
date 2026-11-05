import type { PaperHost } from '@washi/paper'
import type { SharedTreePage, ShareHostOptions } from './types'

export const base = (workspaceId: string, token: string) =>
  `/api/share/${encodeURIComponent(workspaceId)}/${encodeURIComponent(token)}`

/** A suggestion's refusal is the server's own words; any other ask says only that it is not shared. */
async function post<T>(url: string, body: unknown, refusal: string, isWordy = false): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const said = (await response.json().catch(() => null)) as { error?: unknown } | null
    const words = isWordy && response.status !== 403 ? said?.error : null
    throw new Error(typeof words === 'string' ? words : refusal)
  }
  return (await response.json()) as T
}

const ask = <T>(workspaceId: string, token: string, page: string | undefined, body: object) =>
  post<T>(
    `${base(workspaceId, token)}/ask`,
    page ? { ...body, page } : body,
    'This part of the page is not shared.',
  )

/** `?page=<id>` for a sub-page the link opens (D123); nothing for its own page. */
export const pageQuery = (page: string | undefined) =>
  page ? `?page=${encodeURIComponent(page)}` : ''

export async function fetchShared(workspaceId: string, token: string, page?: string) {
  const response = await fetch(`${base(workspaceId, token)}${pageQuery(page)}`)
  return response.ok ? response.json() : null
}

/** The pages from the link's own down to `page`, for the trail over a sub-page. */
export function trailTo(page: string, pages: SharedTreePage[]): SharedTreePage[] {
  const byId = new Map(pages.map((entry) => [entry.id, entry]))
  const trail: SharedTreePage[] = []
  for (let at = byId.get(page); at && trail.length < 64; at = byId.get(at.parentId)) {
    trail.unshift(at)
  }
  return trail
}

/**
 * A host that can only read what the link allows; every write and every other page refuses. A
 * page that takes suggestions sends its adds to be approved instead (D120); one that doesn't
 * draws none.
 */
export function shareHost(
  workspaceId: string,
  token: string,
  { embedsAnySite, suggest, page, home, pages, open }: ShareHostOptions,
): PaperHost {
  const refuse = async () => {
    throw new Error('This is a read-only copy of the page.')
  }
  const asked = <T>(body: object) => ask<T>(workspaceId, token, page, body)
  const describe = (kind: 'table' | 'writable') => (name: string) =>
    asked({ kind, name }).catch(() => null) as ReturnType<PaperHost['describeTable']>
  // The pages this link opens (D123): its own and, when it shares them, its sub-pages.
  const opens = new Map<string, { title: string; icon: string | null }>(
    [...(home ? [home] : []), ...pages].map((entry) => [entry.id, entry]),
  )
  const tree = pages.length > 0 && home
  return {
    runQuery: (query) => asked({ kind: 'rows', query }),
    runHistory: (query) => asked({ kind: 'history', query }),
    describeTable: describe('table'),
    requested: (table, date, from, to) =>
      asked({ kind: 'requested', ask: { table, date, from, to } }),
    isReadOnly: true,
    ...(suggest && {
      describeWritable: describe('writable'),
      suggestRow: async (table, cells, visitor) => {
        await post(
          `${base(workspaceId, token)}/suggest`,
          { table, cells, ...visitor },
          'This page does not take suggestions.',
          true,
        )
      },
    }),
    // The page's code runs in the visitor's sandbox as a member's would (D125), compiled from the
    // server's own copy of the page — whatever source paper hands in is not sent.
    compilePage: () => asked({ kind: 'compile' }),
    runAction: refuse,
    toggleTask: refuse,
    resolveSheet: async (id) => {
      const found = opens.get(id)
      return found ? { title: found.title, icon: found.icon } : null
    },
    openSheet: (id) => {
      if (opens.has(id)) open(id === home?.id ? undefined : id)
    },
    ...(tree && {
      pageId: page ?? home.id,
      listPages: (parentId: string) =>
        pages
          .filter((entry) => entry.parentId === parentId)
          .map(({ id, title, icon, cover }) => ({ id, title, icon, cover })),
    }),
    embedAllowed: async () => embedsAnySite,
    locale: typeof navigator === 'undefined' ? 'en-US' : navigator.language,
  }
}
