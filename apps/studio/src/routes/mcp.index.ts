import { createFileRoute } from '@tanstack/react-router'
import { answerMcp } from '@washi/mcp'
import { mcpSessionFor } from '@/server/mcp'

/**
 * The server's one MCP address (D101): an agent signed in over OAuth acts in the workspace its
 * person picked on consent; an access token acts in its own.
 */
async function answer({ request }: { request: Request }) {
  const session = await mcpSessionFor(request, null)
  if (session instanceof Response) return session
  return answerMcp(request, session)
}

export const Route = createFileRoute('/mcp/')({
  server: { handlers: { POST: answer, GET: answer, DELETE: answer } },
})
