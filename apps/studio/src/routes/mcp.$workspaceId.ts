import { createFileRoute } from '@tanstack/react-router'
import { answerMcp } from '@washi/mcp'
import { mcpSessionFor } from '@/server/mcp'

/**
 * A workspace as an MCP server (D101): an outside agent — Claude Code, any MCP client — reads and
 * writes it as the member whose token it holds. Streamable HTTP, stateless, JSON answers.
 */
async function answer({ request, params }: { request: Request; params: { workspaceId: string } }) {
  const session = await mcpSessionFor(request, params.workspaceId)
  if (session instanceof Response) return session
  return answerMcp(request, session)
}

export const Route = createFileRoute('/mcp/$workspaceId')({
  server: { handlers: { POST: answer, GET: answer, DELETE: answer } },
})
