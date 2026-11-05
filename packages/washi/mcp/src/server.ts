import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import {
  type Capability,
  commentCapabilities,
  fileCapabilities,
  pageCapabilities,
  tableCapabilities,
} from '@washi/service'
import { z } from 'zod'
import type { McpSession, McpWorkspaces } from './types'
import { notAWorkspace, workspaceNamed } from './utils'
import {
  CHANGES,
  DEFAULT_CHANGE,
  INSTRUCTIONS,
  MANY_WORKSPACES,
  SERVER_INFO,
  WORKSPACE_ARG,
} from './values'

/**
 * Everything an outside agent may do: pages, tables, comments and uploads, as the member — no
 * fetch, search or verbs.
 */
function capabilitiesFor(session: McpSession): Capability[] {
  const base = session.baseUrl?.replace(/\/+$/, '')
  const workspace = encodeURIComponent(session.ws.id)
  const context = {
    viewer: session.viewer,
    author: session.member.id,
    listPeople: session.listPeople,
    ...(base ? { pageUrl: (id: string) => `${base}/w/${workspace}/p/${id}` } : {}),
  }
  const fileUrl = base
    ? (id: string) => `${base}/api/files/${id}?workspace=${workspace}`
    : undefined
  return [
    ...pageCapabilities(session.ws, context),
    ...tableCapabilities(session.ws, context),
    ...commentCapabilities(session.ws, { ...context, authorName: session.member.name }),
    ...(session.files ? fileCapabilities(session.ws, session.files, fileUrl) : []),
  ]
}

const said = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) ?? 'null' }],
})

/**
 * Where a call acts: the default session, or the workspace it names (D124) — opened once per
 * request, as the same member, only if this sign-in reaches it.
 */
function placesFor(session: McpSession, workspaces: McpWorkspaces | undefined) {
  const opened = new Map<string, Promise<McpSession | null>>([
    [session.ws.id, Promise.resolve(session)],
  ])
  return async (ref: string | undefined): Promise<McpSession> => {
    if (!ref || !workspaces) return session
    const found = workspaceNamed(workspaces.list, ref)
    if (!found) throw new Error(notAWorkspace(ref, workspaces.list))
    if (!opened.has(found.id)) opened.set(found.id, workspaces.open(found.id))
    const there = await opened.get(found.id)
    if (!there) throw new Error(notAWorkspace(ref, workspaces.list))
    return there
  }
}

function listWorkspacesTool(server: McpServer, session: McpSession, workspaces: McpWorkspaces) {
  server.registerTool(
    'workspace_list',
    {
      description:
        'The workspaces you may work in, the default first: each id and name. Pass either as `workspace` on any other tool to act there.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () =>
      said(workspaces.list.map((each) => ({ ...each, isDefault: each.id === session.ws.id }))),
  )
}

function serverFor(session: McpSession, workspaces?: McpWorkspaces): McpServer {
  const isMany = (workspaces?.list.length ?? 0) > 1
  const server = new McpServer(SERVER_INFO, {
    instructions: isMany ? `${INSTRUCTIONS}${MANY_WORKSPACES}` : INSTRUCTIONS,
  })
  if (workspaces) listWorkspacesTool(server, session, workspaces)
  const placeOf = placesFor(session, workspaces)
  for (const each of capabilitiesFor(session)) {
    server.registerTool(
      each.name,
      {
        description: each.description,
        inputSchema: isMany
          ? {
              ...each.input,
              workspace: z.string().min(1).max(200).optional().describe(WORKSPACE_ARG),
            }
          : each.input,
        annotations: { readOnlyHint: each.isReadOnly, openWorldHint: false },
      },
      async (input: unknown) => {
        try {
          const { workspace, ...rest } = (input ?? {}) as { workspace?: string }
          const there = isMany ? await placeOf(workspace) : session
          const run =
            there === session
              ? each
              : capabilitiesFor(there).find((other) => other.name === each.name)
          if (!run) throw new Error(`${each.name} is not available in that workspace`)
          const result = await run.run(isMany ? rest : input)
          if (!run.isReadOnly) {
            there.changed(CHANGES[run.name.split('_')[0] ?? ''] ?? DEFAULT_CHANGE)
          }
          return said(result)
        } catch (error) {
          return { ...said(error instanceof Error ? error.message : String(error)), isError: true }
        }
      },
    )
  }
  return server
}

/**
 * One MCP request answered statelessly (Streamable HTTP, JSON responses): a server built for this
 * member and workspace, connected, asked, done. Nothing lives between requests. With `workspaces`
 * (a sign-in that reaches several, D124) each tool may name another to act in.
 */
export async function answerMcp(
  request: Request,
  session: McpSession,
  workspaces?: McpWorkspaces,
): Promise<Response> {
  const server = serverFor(session, workspaces)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)
  try {
    return await transport.handleRequest(request)
  } finally {
    await server.close()
  }
}
