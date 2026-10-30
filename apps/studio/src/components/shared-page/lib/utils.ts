import type { PaperHost } from '@washi/paper'

export const base = (workspaceId: string, token: string) =>
  `/api/share/${encodeURIComponent(workspaceId)}/${encodeURIComponent(token)}`

async function ask<T>(workspaceId: string, token: string, body: unknown): Promise<T> {
  const response = await fetch(`${base(workspaceId, token)}/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error('This part of the page is not shared.')
  return (await response.json()) as T
}

export async function fetchShared(workspaceId: string, token: string) {
  const response = await fetch(base(workspaceId, token))
  return response.ok ? response.json() : null
}

/** A host that can only read what the link allows; every write and every other page refuses. */
export function shareHost(workspaceId: string, token: string, embedsAnySite = false): PaperHost {
  const refuse = async () => {
    throw new Error('This is a read-only copy of the page.')
  }
  return {
    runQuery: (query) => ask(workspaceId, token, { kind: 'rows', query }),
    runHistory: (query) => ask(workspaceId, token, { kind: 'history', query }),
    describeTable: (name) =>
      ask(workspaceId, token, { kind: 'table', name }).catch(() => null) as ReturnType<
        PaperHost['describeTable']
      >,
    runAction: refuse,
    toggleTask: refuse,
    resolveSheet: async () => null,
    openSheet: () => undefined,
    embedAllowed: async () => embedsAnySite,
    locale: typeof navigator === 'undefined' ? 'en-US' : navigator.language,
  }
}
