import type { Viewer } from '@washi/domain'
import { getAppMeta, getSheet, setAppMeta, type Workspace } from '@washi/repository'
import { parse } from '@washi/wsx'
import { pagesFor } from '../agents/lib/pages'
import { SheetNotFoundError } from '../sheets/access'
import { cutAt } from './budget'
import { AgentGuideError } from './errors'
import { pageMarkdown } from './render'
import { renderContextOf, treeOf } from './tree'
import type { AgentGuide } from './types'
import { AGENT_GUIDE_KEY, GUIDE_MAX_CHARS } from './values'

/** The page this workspace keeps for outside agents to read first, by id — or none. */
export function agentGuideId(ws: Workspace): string | null {
  return getAppMeta(ws, AGENT_GUIDE_KEY) || null
}

/**
 * Marks a page as the workspace's agent guide (D135), or clears it with null — an owner's or an
 * admin's call, as it speaks to every agent working here. The page must be one they read and in the
 * tree (a row's page is its table's); a guide in place that they cannot read is not theirs to move.
 */
export function setAgentGuide(
  ws: Workspace,
  id: string | null,
  viewer: Viewer,
  isSteward: boolean,
): { id: string; title: string } | null {
  if (!isSteward) {
    throw new AgentGuideError('only an owner or an admin of this workspace sets its agent guide')
  }
  const pages = pagesFor(ws, viewer)
  const current = agentGuideId(ws)
  if (current && current !== id && getSheet(ws, current) && !pages.get(current)) {
    throw new AgentGuideError(
      'the agent guide now is a page you cannot read — whoever can read it moves or clears it',
    )
  }
  if (id === null) {
    setAppMeta(ws, AGENT_GUIDE_KEY, '')
    return null
  }
  const page = pages.get(id)
  if (!page) throw new SheetNotFoundError(id)
  if (page.rowOf) {
    throw new AgentGuideError(
      "a row's page cannot be the agent guide — pick a page of the tree, or make one",
    )
  }
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
