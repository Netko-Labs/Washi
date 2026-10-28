import { embedHost } from '@washi/paper/registry'
import { getAppMeta, setAppMeta, type Workspace } from '@washi/repository'

const EMBED_HOSTS = 'embed_hosts'

export class EmbedHostError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EmbedHostError'
  }
}

/** Sites past the built-in providers that this workspace's pages may embed. */
export function embedHosts(ws: Workspace): string[] {
  const stored = getAppMeta(ws, EMBED_HOSTS)
  return stored ? (JSON.parse(stored) as string[]) : []
}

/** Pasted addresses become bare host names; one that is no host is refused in words. */
export function setEmbedHosts(ws: Workspace, raw: string[]): string[] {
  const hosts: string[] = []
  for (const entry of raw) {
    const host = embedHost(entry)
    if (!host) throw new EmbedHostError(`“${entry}” is not a site address — try docs.example.com`)
    if (!hosts.includes(host)) hosts.push(host)
  }
  setAppMeta(ws, EMBED_HOSTS, JSON.stringify(hosts.sort()))
  return embedHosts(ws)
}

const WIDGETS = 'widgets_enabled'

/** Whether pages may run their own HTML in a widget — off until an owner says so. */
export function widgetsEnabled(ws: Workspace): boolean {
  return getAppMeta(ws, WIDGETS) === '1'
}

export function setWidgetsEnabled(ws: Workspace, enabled: boolean): boolean {
  setAppMeta(ws, WIDGETS, enabled ? '1' : '0')
  return widgetsEnabled(ws)
}
