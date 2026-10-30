import {
  type PagePackageSet,
  processSingleton,
  type ServerPolicy,
  serverPolicySchema,
  type WorkspaceDefaults,
} from '@washi/domain'
import { PAGE_LIBRARIES } from '@washi/paper/registry'
import { setAppMeta, type Workspace } from '@washi/repository'
import { isPrivateAddress } from '@washi/tsuru'
import { APPROVAL_MODE_KEY, DAILY_CAP_USD_KEY, DAILY_TURN_CAP_KEY } from '../agents/lib'
import {
  BUILT_IN_IMPORTS,
  FETCH_HOST,
  PACKAGE_NAME,
  PACKAGE_NAME_MAX,
  PACKAGE_SPEC,
} from './constants'
import { FetchHostError, PagePackageError } from './errors'
import type { LentServer } from './types'

const NO_POLICY: ServerPolicy = serverPolicySchema.parse({})

// Callbacks, not data: the runtime lends what the server says, read again on every check (C3).
const lent = processSingleton('server-policy', () => new WeakMap<Workspace, LentServer>())

export function lendServerPolicy(
  ws: Workspace,
  read: () => ServerPolicy,
  pagePackages?: () => PagePackageSet,
): () => void {
  lent.set(ws, { policy: read, pagePackages })
  return () => lent.delete(ws)
}

/** The server's say over this workspace; embedded has none, so it adds nothing. */
export function serverPolicy(ws: Workspace): ServerPolicy {
  return lent.get(ws)?.policy() ?? NO_POLICY
}

/** The server's page packages ready to import (D116); null where no server installs any. */
export function pagePackagesOf(ws: Workspace | undefined): PagePackageSet | null {
  return (ws && lent.get(ws)?.pagePackages?.()) ?? null
}

/** `name@version` as an admin types it; a range or a tag resolves at install, `latest` if none. */
export function pagePackageSpec(raw: string): { name: string; spec: string } {
  const typed = raw.trim()
  const at = typed.lastIndexOf('@')
  const name = (at > 0 ? typed.slice(0, at) : typed).toLowerCase()
  const spec = at > 0 ? typed.slice(at + 1).trim() : 'latest'
  if (!name || name.length > PACKAGE_NAME_MAX || !PACKAGE_NAME.test(name)) {
    throw new PagePackageError(`“${typed}” is not an npm package name — try nanoid or @scope/name`)
  }
  if (!PACKAGE_SPEC.test(spec)) {
    throw new PagePackageError(
      `“${spec}” is not a version — an exact one (1.2.3), a range (^1.2) or a tag (latest)`,
    )
  }
  if ([...BUILT_IN_IMPORTS, ...PAGE_LIBRARIES].includes(name)) {
    throw new PagePackageError(`${name} is Washi's own — every page imports it already`)
  }
  return { name, spec }
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
