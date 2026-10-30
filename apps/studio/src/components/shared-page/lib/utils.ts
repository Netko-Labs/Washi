import type { PaperHost } from '@washi/paper'
import type { ShareHostOptions } from './types'

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

const ask = <T>(workspaceId: string, token: string, body: unknown) =>
  post<T>(`${base(workspaceId, token)}/ask`, body, 'This part of the page is not shared.')

export async function fetchShared(workspaceId: string, token: string) {
  const response = await fetch(base(workspaceId, token))
  return response.ok ? response.json() : null
}

/**
 * A host that can only read what the link allows; every write and every other page refuses. A
 * page that takes suggestions sends its adds to be approved instead (D120); one that doesn't
 * draws none.
 */
export function shareHost(
  workspaceId: string,
  token: string,
  { embedsAnySite, suggest }: ShareHostOptions,
): PaperHost {
  const refuse = async () => {
    throw new Error('This is a read-only copy of the page.')
  }
  const describe = (kind: 'table' | 'writable') => (name: string) =>
    ask(workspaceId, token, { kind, name }).catch(() => null) as ReturnType<
      PaperHost['describeTable']
    >
  return {
    runQuery: (query) => ask(workspaceId, token, { kind: 'rows', query }),
    runHistory: (query) => ask(workspaceId, token, { kind: 'history', query }),
    describeTable: describe('table'),
    requested: (table, date, from, to) =>
      ask(workspaceId, token, { kind: 'requested', ask: { table, date, from, to } }),
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
    runAction: refuse,
    toggleTask: refuse,
    resolveSheet: async () => null,
    openSheet: () => undefined,
    embedAllowed: async () => embedsAnySite,
    locale: typeof navigator === 'undefined' ? 'en-US' : navigator.language,
  }
}
