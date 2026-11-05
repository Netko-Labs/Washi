import { createFileRoute } from '@tanstack/react-router'
import { answerMcp } from '@washi/mcp'
import { mcpSessionFor } from '@/server/mcp'

/**
 * The server's one MCP address (D101): an agent signed in over OAuth acts in the workspaces its
 * person picked on consent (D124), the default unless a call names another; an access token acts
 * in its own.
 */
async function answer({ request }: { request: Request }) {
  const found = await mcpSessionFor(request, null)
  if (found instanceof Response) return found
  return answerMcp(request, found.session, found.workspaces)
}

export const Route = createFileRoute('/mcp/')({
  server: { handlers: { POST: answer, GET: answer, DELETE: answer } },
})
