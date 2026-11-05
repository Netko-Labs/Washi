import type { McpSession, McpWorkspaces } from '@washi/mcp'
import { washiRuntime } from '@/server/runtime'
import type { McpAnswer, Runtime } from './types'

const BEARER = /^Bearer\s+(\S+)$/i

/** The server's own address: what it says it is, else where this request came in. */
const originOf = (request: Request) =>
  (process.env.WASHI_BASE_URL ?? new URL(request.url).origin).replace(/\/+$/, '')

/** A 401 that says nothing about the workspace, and where an agent learns to sign in (RFC 9728). */
function unauthorized(request: Request): Response {
  const metadata = `${originOf(request)}/.well-known/oauth-protected-resource/mcp`
  return Response.json(
    { error: 'sign in, or a Washi access token for this workspace' },
    { status: 401, headers: { 'www-authenticate': `Bearer resource_metadata="${metadata}"` } },
  )
}

/** One workspace as an MCP session for its member, or null once they are no longer one. */
async function sessionIn(
  runtime: Runtime,
  request: Request,
  actorId: string,
  workspaceId: string,
): Promise<McpSession | null> {
  const { control } = runtime
  if (!(await control.authorize(actorId, workspaceId))) return null
  const [workspaces, members] = await Promise.all([
    control.listWorkspaces(actorId),
    control.listMembers(workspaceId),
  ])
  const role = workspaces.find((each) => each.id === workspaceId)?.role
  const member = members.find((each) => each.id === actorId) ?? { id: actorId, name: 'A member' }
  const resolved = runtime.resolve(workspaceId)
  return {
    ws: resolved.workspace,
    files: resolved.files,
    baseUrl: originOf(request),
    viewer: { id: actorId, isOwner: role === 'owner' },
    member,
    listPeople: () => control.listMembers(workspaceId),
    changed: (kinds) => {
      for (const kind of kinds) {
        runtime.events.emit('workspaceChanged', { workspaceId, kind, id: null })
      }
    },
  }
}

/**
 * Who an MCP request acts for, and where (D101): a member's access token (its workspace), or an
 * OAuth sign-in (the workspaces they picked on consent, D124) — on `/mcp/<id>`, only that one —
 * and only while they are still a member. A sign-in that reaches several answers each of them as
 * `workspaces`, the default first; it acts in the default unless a call names another.
 */
export async function mcpSessionFor(
  request: Request,
  workspaceId: string | null,
): Promise<McpAnswer | Response> {
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
  const granted = owner
    ? [owner.workspaceId]
    : caller
      ? ((await control.oauth?.workspacesOf(caller)) ?? [])
      : []
  // Only those the person is still a member of; leaving one drops it from the grant's reach.
  const reachable = (
    await Promise.all(
      granted.map(async (id) => (actorId && (await control.authorize(actorId, id)) ? id : null)),
    )
  ).filter((id): id is string => id !== null)
  const here = workspaceId ? reachable.filter((id) => id === workspaceId) : reachable
  const first = here[0]
  if (!actorId || !first) return unauthorized(request)

  const session = await sessionIn(runtime, request, actorId, first)
  if (!session) return unauthorized(request)
  if (here.length === 1) return { session }
  const names = new Map(
    (await control.listWorkspaces(actorId)).map((each) => [each.id, each.name] as const),
  )
  const workspaces: McpWorkspaces = {
    list: here.map((id) => ({ id, name: names.get(id) ?? id })),
    open: (id) =>
      here.includes(id) ? sessionIn(runtime, request, actorId, id) : Promise.resolve(null),
  }
  return { session, workspaces }
}
