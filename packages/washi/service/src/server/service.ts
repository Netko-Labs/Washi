import { type ServerPolicy, serverPolicySchema, type WorkspaceDefaults } from '@washi/domain'
import { setAppMeta, type Workspace } from '@washi/repository'
import { isPrivateAddress } from '@washi/tsuru'
import { APPROVAL_MODE_KEY, DAILY_CAP_USD_KEY, DAILY_TURN_CAP_KEY } from '../agents/lib'
import { FETCH_HOST } from './constants'
import { FetchHostError } from './errors'

const NO_POLICY: ServerPolicy = serverPolicySchema.parse({})

// Callbacks, not data: the runtime lends what the server says, read again on every check (C3).
const lent = new WeakMap<Workspace, () => ServerPolicy>()

export function lendServerPolicy(ws: Workspace, read: () => ServerPolicy): () => void {
  lent.set(ws, read)
  return () => lent.delete(ws)
}

/** The server's say over this workspace; embedded has none, so it adds nothing. */
export function serverPolicy(ws: Workspace): ServerPolicy {
  return lent.get(ws)?.() ?? NO_POLICY
}

/** Written into a new workspace's own file once; from then on its owners change them there. */
export function applyWorkspaceDefaults(ws: Workspace, defaults: WorkspaceDefaults): void {
  if (defaults.approvalMode) setAppMeta(ws, APPROVAL_MODE_KEY, defaults.approvalMode)
  if (defaults.dailyCapUsd !== undefined) {
    setAppMeta(ws, DAILY_CAP_USD_KEY, String(defaults.dailyCapUsd))
  }
  if (defaults.turnCap !== undefined) setAppMeta(ws, DAILY_TURN_CAP_KEY, String(defaults.turnCap))
}

/** Pasted addresses become bare host names; an address or a private name is refused in words. */
export function fetchHostList(raw: string[]): string[] {
  const hosts: string[] = []
  for (const entry of raw) {
    const host = entry
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/[/:?#].*$/, '')
    if (!FETCH_HOST.test(host)) {
      throw new FetchHostError(`“${entry}” is not a host — try api.example.com or *.example.com`)
    }
    if (isPrivateAddress(host.replace(/^\*\./, ''))) {
      throw new FetchHostError(`“${entry}” is a private name — Washi never reaches those`)
    }
    if (!hosts.includes(host)) hosts.push(host)
  }
  return hosts.sort()
}
