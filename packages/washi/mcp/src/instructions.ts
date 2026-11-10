import { agentGuide, agentGuidePage } from '@washi/service'
import type { McpSession, McpWorkspaces } from './types'
import { INSTRUCTIONS, MANY_WORKSPACES } from './values'

/** Whether this request opens a conversation — the only answer that carries the instructions. */
export async function asksInitialize(request: Request): Promise<boolean> {
  if (request.method !== 'POST') return false
  try {
    const body: unknown = await request.clone().json()
    const calls = Array.isArray(body) ? body : [body]
    return calls.some(
      (call) =>
        call && typeof call === 'object' && (call as { method?: unknown }).method === 'initialize',
    )
  } catch {
    return false
  }
}

/** The default workspace's guide, as its member may read it, said after the server's own words. */
function guideWords(session: McpSession): string {
  const guide = agentGuide(session.ws, session.viewer)
  if (!guide) return ''
  const where = session.name ? `${session.name} keeps` : 'This workspace keeps'
  return `\n\n${where} an agent guide, "${guide.title}" (page ${guide.id}). Follow it as you would a repo's CLAUDE.md; context_get starts with it:\n\n${guide.markdown}`
}

/** Which of the other workspaces keep a guide — opened only when a conversation starts. */
async function othersWords(session: McpSession, workspaces: McpWorkspaces): Promise<string> {
  const others = await Promise.all(
    workspaces.list
      .filter((each) => each.id !== session.ws.id)
      .map(async (each) => {
        const there = await workspaces.open(each.id)
        const guide = there ? agentGuidePage(there.ws, there.viewer) : null
        return guide ? `${each.name} ("${guide.title}")` : null
      }),
  )
  const named = others.filter(Boolean)
  return named.length
    ? `\n\nOther workspaces with an agent guide: ${named.join(', ')}. Before working in one, read it: context_get with that workspace leads with it.`
    : ''
}

/**
 * What the server tells an agent as it connects: how to use Washi, the default workspace's guide
 * (D135) and, with several workspaces, which others keep one. Only an `initialize` reads them.
 */
export async function instructionsFor(
  session: McpSession,
  workspaces: McpWorkspaces | undefined,
  isInitialize: boolean,
): Promise<string> {
  const isMany = (workspaces?.list.length ?? 0) > 1
  const base = isMany ? `${INSTRUCTIONS}${MANY_WORKSPACES}` : INSTRUCTIONS
  if (!isInitialize) return base
  const others = isMany && workspaces ? await othersWords(session, workspaces) : ''
  return `${base}${guideWords(session)}${others}`
}
