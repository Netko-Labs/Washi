import {
  ANY_HOST,
  type CodeLimits,
  type PagePackageSet,
  processSingleton,
  type ServerPolicy,
  serverPolicySchema,
  type WorkspaceDefaults,
} from '@washi/domain'
import { PAGE_LIBRARIES } from '@washi/paper/registry'
import { setAppMeta, type Workspace } from '@washi/repository'
import { hostEntry, isPrivateAddress } from '@washi/tsuru'
import { APPROVAL_MODE_KEY, DAILY_CAP_USD_KEY, DAILY_TURN_CAP_KEY } from '../agents/lib'
import {
  BUILT_IN_IMPORTS,
  HOST_WORDS,
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

/** What code may spend here (D118): the server's numbers, else today's constants. */
export function codeLimits(ws: Workspace): CodeLimits {
  return serverPolicy(ws).limits
}

/** The server's admin said yes to everything that leaves, in every workspace (D118). */
export function serverApprovesAll(ws: Workspace): boolean {
  return serverPolicy(ws).safeguards.approveAll
}

/** Whether tsuru may reach private, loopback and metadata addresses here (D118). */
export function privateNetworkAllowed(ws: Workspace): boolean {
  return serverPolicy(ws).safeguards.privateNetwork
}

/** Written into a new workspace's own file once; from then on its owners change them there. */
export function applyWorkspaceDefaults(ws: Workspace, defaults: WorkspaceDefaults): void {
  if (defaults.approvalMode) setAppMeta(ws, APPROVAL_MODE_KEY, defaults.approvalMode)
  if (defaults.dailyCapUsd !== undefined) {
    setAppMeta(ws, DAILY_CAP_USD_KEY, String(defaults.dailyCapUsd))
  }
  if (defaults.turnCap !== undefined) setAppMeta(ws, DAILY_TURN_CAP_KEY, String(defaults.turnCap))
}

/**
 * Pasted entries as a list keeps them: hosts, `*.domain` or `*`, sorted and once each; anything
 * else is refused in words.
 */
export function hostList(raw: string[], refuse: (entry: string) => Error): string[] {
  const hosts: string[] = []
  for (const entry of raw) {
    const host = hostEntry(entry)
    if (!host) throw refuse(`“${entry}” is not a host — ${HOST_WORDS}`)
    if (!hosts.includes(host)) hosts.push(host)
  }
  return hosts.sort()
}

/** A fetch list also refuses a private name: one reaches those only by asking (D118). */
export function fetchHostList(raw: string[]): string[] {
  const refuse = (message: string) => new FetchHostError(message)
  const hosts = hostList(raw, refuse)
  const named = hosts.find(
    (host) => host !== ANY_HOST && isPrivateAddress(host.replace(/^\*\./, '')),
  )
  if (named) throw refuse(`“${named}” is a private name — Washi reaches those only by asking`)
  return hosts
}
