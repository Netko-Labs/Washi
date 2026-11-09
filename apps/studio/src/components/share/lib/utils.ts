/** A page's read-only link: the workspace in the path, the token is the key (D65). */
export function shareUrl(workspaceId: string, token: string): string {
  return new URL(`/s/${workspaceId}/${token}`, window.location.origin).toString()
}

/** "2 redacted blocks · 1 secret tab · deals: amount, contact" — or null when it hides nothing. */
export function hiddenInWords(hidden: {
  blocks: number
  tabs?: number
  columns: Record<string, string[]>
}) {
  const parts: string[] = []
  if (hidden.blocks > 0)
    parts.push(`${hidden.blocks} redacted block${hidden.blocks === 1 ? '' : 's'}`)
  const tabs = hidden.tabs ?? 0
  if (tabs > 0) parts.push(`${tabs} secret tab${tabs === 1 ? '' : 's'}`)
  for (const [table, columns] of Object.entries(hidden.columns)) {
    parts.push(`${table}: ${columns.join(', ')}`)
  }
  return parts.length > 0 ? parts.join(' · ') : null
}
