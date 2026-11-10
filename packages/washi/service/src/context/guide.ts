import type { Viewer } from '@washi/domain'
import { getAppMeta, setAppMeta, type Workspace } from '@washi/repository'
import { parse } from '@washi/wsx'
import { pagesFor } from '../agents/lib/pages'
import { SheetNotFoundError } from '../sheets/access'
import { cutAt } from './budget'
import { pageMarkdown } from './render'
import { renderContextOf, treeOf } from './tree'
import type { AgentGuide } from './types'
import { AGENT_GUIDE_KEY, GUIDE_MAX_CHARS } from './values'

/** The page this workspace keeps for outside agents to read first, by id — or none. */
export function agentGuideId(ws: Workspace): string | null {
  return getAppMeta(ws, AGENT_GUIDE_KEY) || null
}

/**
 * Marks a page as the workspace's agent guide (D135), or clears it with null. Any member who reads
 * the page may: it is a pointer, and every agent still reads it only as its own member can.
 */
export function setAgentGuide(
  ws: Workspace,
  id: string | null,
  viewer: Viewer,
): { id: string; title: string } | null {
  if (id === null) {
    setAppMeta(ws, AGENT_GUIDE_KEY, '')
    return null
  }
  const page = pagesFor(ws, viewer).get(id)
  if (!page) throw new SheetNotFoundError(id)
  setAppMeta(ws, AGENT_GUIDE_KEY, id)
  return { id: page.id, title: page.title }
}

/** The guide page's id and title, when this reader may read it — what a listing names. */
export function agentGuidePage(
  ws: Workspace,
  viewer: Viewer,
): { id: string; title: string } | null {
  const id = agentGuideId(ws)
  const page = id ? pagesFor(ws, viewer).get(id) : null
  return page ? { id: page.id, title: page.title } : null
}

/** The guide's words as this reader may read them, cut to `maxChars`; none when they cannot. */
export function agentGuide(
  ws: Workspace,
  viewer: Viewer,
  maxChars = GUIDE_MAX_CHARS,
): AgentGuide | null {
  const id = agentGuideId(ws)
  if (!id) return null
  const pages = pagesFor(ws, viewer)
  const page = pages.get(id)
  if (!page) return null
  let markdown: string
  try {
    markdown = pageMarkdown(parse(page.source), renderContextOf(treeOf(pages.list()), id))
  } catch {
    return null
  }
  return { id, title: page.title, markdown: guideText(markdown, id, maxChars) }
}

/** The guide's words cut to its cap, saying where the rest is. */
export function guideText(markdown: string, id: string, maxChars = GUIDE_MAX_CHARS): string {
  const cut = cutAt(markdown, maxChars)
  return cut === markdown
    ? markdown
    : `${cut} …\n\n*The guide goes on — sheet_get { "id": "${id}" }.*`
}
