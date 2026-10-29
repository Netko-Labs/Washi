import type { McpSession } from '@washi/mcp'
import { washiRuntime } from '@/server/runtime'

const BEARER = /^Bearer\s+(\S+)$/i

/** A 401 that says nothing about the workspace, and where an agent learns to sign in (RFC 9728). */
function unauthorized(request: Request): Response {
  const origin = process.env.WASHI_BASE_URL ?? new URL(request.url).origin
  const metadata = `${origin.replace(/\/+$/, '')}/.well-known/oauth-protected-resource/mcp`
  return Response.json(
    { error: 'sign in, or a Washi access token for this workspace' },
    { status: 401, headers: { 'www-authenticate': `Bearer resource_metadata="${metadata}"` } },
  )
}

/**
 * Who an MCP request acts for, and where (D101): a member's access token (its workspace), or an
 * OAuth sign-in (the workspace they picked on consent) — on `/mcp/<id>`, only for that one — and
 * only while they are still a member.
 */
export async function mcpSessionFor(
  request: Request,
  workspaceId: string | null,
): Promise<McpSession | Response> {
  const { runtime } = await washiRuntime()
  const { control } = runtime
  if (!control.tokens && !control.oauth) {
    return Response.json({ error: 'this server takes no outside agents' }, { status: 404 })
  }
  const bearer = BEARER.exec(request.headers.get('authorization') ?? '')?.[1]
  if (!bearer) return unauthorized(request)

  const owner = await control.tokens?.verify(bearer)
  const caller = owner ? null : await control.oauth?.verify(bearer)
  const actorId = owner?.actorId ?? caller?.actorId
  const granted =
    owner?.workspaceId ?? (caller ? await control.oauth?.workspaceOf(caller) : undefined)
  if (!actorId || !granted || (workspaceId && workspaceId !== granted)) return unauthorized(request)
  if (!(await control.authorize(actorId, granted))) return unauthorized(request)

  const [workspaces, members] = await Promise.all([
    control.listWorkspaces(actorId),
    control.listMembers(granted),
  ])
  const role = workspaces.find((each) => each.id === granted)?.role
  const member = members.find((each) => each.id === actorId) ?? { id: actorId, name: 'A member' }
  return {
    ws: runtime.resolve(granted).workspace,
    viewer: { id: actorId, isOwner: role === 'owner' },
    member,
    listPeople: () => control.listMembers(granted),
    changed: (kinds) => {
      for (const kind of kinds) {
        runtime.events.emit('workspaceChanged', { workspaceId: granted, kind, id: null })
      }
    },
  }
}
