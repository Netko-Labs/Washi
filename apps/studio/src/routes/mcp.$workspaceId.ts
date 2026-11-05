import { createFileRoute } from '@tanstack/react-router'
import { answerMcp } from '@washi/mcp'
import { mcpSessionFor } from '@/server/mcp'

/**
 * A workspace as an MCP server (D101): an outside agent — Claude Code, any MCP client — reads and
 * writes it as the member whose token it holds. Streamable HTTP, stateless, JSON answers.
 */
async function answer({ request, params }: { request: Request; params: { workspaceId: string } }) {
  const found = await mcpSessionFor(request, params.workspaceId)
  if (found instanceof Response) return found
  return answerMcp(request, found.session)
}

export const Route = createFileRoute('/mcp/$workspaceId')({
  server: { handlers: { POST: answer, GET: answer, DELETE: answer } },
})
