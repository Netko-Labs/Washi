import type { McpSession } from '@washi/mcp'
import { washiRuntime } from '@/server/runtime'

const refuse = (status: number, error: string, headers?: HeadersInit) =>
  Response.json({ error }, { status, headers })

const BEARER = /^Bearer\s+(\S+)$/i

/**
 * Who an MCP request acts for: a member's token for this very workspace, while they are still in
 * it. Anything else is a 401 with nothing said about whether the workspace exists.
 */
export async function mcpSessionFor(
  request: Request,
  workspaceId: string,
): Promise<McpSession | Response> {
  const { runtime } = await washiRuntime()
  const { control } = runtime
  if (!control.tokens) return refuse(404, 'this server takes no outside agents')
  const bearer = BEARER.exec(request.headers.get('authorization') ?? '')?.[1]
  const owner = bearer ? await control.tokens.verify(bearer) : null
  const challenge = { 'www-authenticate': 'Bearer realm="washi"' }
  if (!owner || owner.workspaceId !== workspaceId) {
    return refuse(401, 'a Washi access token for this workspace', challenge)
  }
  if (!(await control.authorize(owner.actorId, workspaceId))) {
    return refuse(401, 'a Washi access token for this workspace', challenge)
  }
  const [workspaces, members] = await Promise.all([
    control.listWorkspaces(owner.actorId),
    control.listMembers(workspaceId),
  ])
  const role = workspaces.find((each) => each.id === workspaceId)?.role
  const member = members.find((each) => each.id === owner.actorId) ?? {
    id: owner.actorId,
    name: 'A member',
  }
  return {
    ws: runtime.resolve(workspaceId).workspace,
    viewer: { id: owner.actorId, isOwner: role === 'owner' },
    member,
    listPeople: () => control.listMembers(workspaceId),
    changed: (kinds) => {
      for (const kind of kinds)
        runtime.events.emit('workspaceChanged', { workspaceId, kind, id: null })
    },
  }
}
