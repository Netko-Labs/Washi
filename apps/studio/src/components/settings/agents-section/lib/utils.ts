/** Where an outside agent reaches this workspace. */
export const mcpUrl = (origin: string, workspaceId: string) => `${origin}/mcp/${workspaceId}`

/** Claude Code over OAuth: the server's one address; `/mcp` in Claude Code then signs in (D101). */
export const claudeSignInCommand = (origin: string) =>
  `claude mcp add --transport http washi ${origin}/mcp`

/** Claude Code's own one-liner: the workspace as an HTTP MCP server, the token as its header. */
export const claudeCommand = (url: string, token: string) =>
  `claude mcp add --transport http washi ${url} --header "Authorization: Bearer ${token}"`

/** "Nov 4" this year, "Nov 4, 2025" before; null reads never. */
export function whenLabel(iso: string | null): string {
  if (!iso) return 'never'
  const date = new Date(iso)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}
