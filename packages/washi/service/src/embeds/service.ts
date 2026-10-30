import { getAppMeta, setAppMeta, type Workspace } from '@washi/repository'
import { hostList, serverPolicy } from '../server'

const EMBED_HOSTS = 'embed_hosts'
const WIDGET_HOSTS = 'widget_hosts'

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

/** Pasted entries become hosts, `*.domain` or `*`; anything else is refused in words (D118). */
export function embedHostList(raw: string[]): string[] {
  return hostList(raw, (message) => new EmbedHostError(message))
}

export function setEmbedHosts(ws: Workspace, raw: string[]): string[] {
  setAppMeta(ws, EMBED_HOSTS, JSON.stringify(embedHostList(raw)))
  return embedHosts(ws)
}

/** What plays here: this workspace's sites and the server's (D105), `*` for every https one. */
export function playableEmbedHosts(ws: Workspace): string[] {
  return [...new Set([...embedHosts(ws), ...serverPolicy(ws).embedHosts])].sort()
}

/** Sites this workspace's widgets may reach, past the server's. */
export function widgetHosts(ws: Workspace): string[] {
  const stored = getAppMeta(ws, WIDGET_HOSTS)
  return stored ? (JSON.parse(stored) as string[]) : []
}

export function setWidgetHosts(ws: Workspace, raw: string[]): string[] {
  setAppMeta(ws, WIDGET_HOSTS, JSON.stringify(embedHostList(raw)))
  return widgetHosts(ws)
}

/** What a widget's frame here may reach (D118); empty, as by default, is no network at all. */
export function reachableWidgetHosts(ws: Workspace): string[] {
  return [...new Set([...widgetHosts(ws), ...serverPolicy(ws).widgetHosts])].sort()
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
