import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import {
  type Capability,
  commentCapabilities,
  pageCapabilities,
  tableCapabilities,
} from '@washi/service'
import type { McpSession } from './types'
import { CHANGES, INSTRUCTIONS, SERVER_INFO } from './values'

/** Everything an outside agent may do: pages, tables and comments, as the member — no fetch, search or verbs. */
function capabilitiesFor(session: McpSession): Capability[] {
  const context = {
    viewer: session.viewer,
    author: session.member.id,
    listPeople: session.listPeople,
  }
  return [
    ...pageCapabilities(session.ws, context),
    ...tableCapabilities(session.ws, context),
    ...commentCapabilities(session.ws, { ...context, authorName: session.member.name }),
  ]
}

const said = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) ?? 'null' }],
})

function serverFor(session: McpSession): McpServer {
  const server = new McpServer(SERVER_INFO, { instructions: INSTRUCTIONS })
  for (const each of capabilitiesFor(session)) {
    server.registerTool(
      each.name,
      {
        description: each.description,
        inputSchema: each.input,
        annotations: { readOnlyHint: each.isReadOnly, openWorldHint: false },
      },
      async (input: unknown) => {
        try {
          const result = await each.run(input)
          if (!each.isReadOnly) session.changed(CHANGES[each.name.split('_')[0] ?? ''] ?? [])
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
 * member and workspace, connected, asked, done. Nothing lives between requests.
 */
export async function answerMcp(request: Request, session: McpSession): Promise<Response> {
  const server = serverFor(session)
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
