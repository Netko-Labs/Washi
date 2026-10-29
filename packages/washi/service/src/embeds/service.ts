import { embedHost } from '@washi/paper/registry'
import { getAppMeta, setAppMeta, type Workspace } from '@washi/repository'
import { serverPolicy } from '../server'

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

/** Pasted addresses become bare, sorted host names; one that is no host is refused in words. */
export function embedHostList(raw: string[]): string[] {
  const hosts: string[] = []
  for (const entry of raw) {
    const host = embedHost(entry)
    if (!host) throw new EmbedHostError(`“${entry}” is not a site address — try docs.example.com`)
    if (!hosts.includes(host)) hosts.push(host)
  }
  return hosts.sort()
}

export function setEmbedHosts(ws: Workspace, raw: string[]): string[] {
  setAppMeta(ws, EMBED_HOSTS, JSON.stringify(embedHostList(raw)))
  return embedHosts(ws)
}

/** What plays here: this workspace's sites and the server's (D105). */
export function playableEmbedHosts(ws: Workspace): string[] {
  return [...new Set([...embedHosts(ws), ...serverPolicy(ws).embedHosts])].sort()
}

const WIDGETS = 'widgets_enabled'

/** The server's switch: off, no workspace on it runs a widget, whatever its own says. */
export function widgetsByServer(ws: Workspace): boolean {
  return serverPolicy(ws).widgets
}

/** Whether pages may run their own HTML in a widget — off until an owner says so. */
export function widgetsEnabled(ws: Workspace): boolean {
  return widgetsByServer(ws) && getAppMeta(ws, WIDGETS) === '1'
}

export function setWidgetsEnabled(ws: Workspace, enabled: boolean): boolean {
  if (enabled && !widgetsByServer(ws)) {
    throw new EmbedHostError('This server keeps widgets off for every workspace on it.')
  }
  setAppMeta(ws, WIDGETS, enabled ? '1' : '0')
  return widgetsEnabled(ws)
}
