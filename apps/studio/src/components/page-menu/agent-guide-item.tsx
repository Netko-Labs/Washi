import { IconRobot } from '@tabler/icons-react'
import type { AgentGuideItemProps } from './lib'
import { useAgentGuide } from './lib'

/**
 * "Agent guide": the page outside agents read first (D135), as CLAUDE.md is for a repo — its words
 * lead their instructions and `context_get`. One page a workspace; a press here moves it.
 */
export function AgentGuideItem({ sheet, className, role }: AgentGuideItemProps) {
  const guide = useAgentGuide(sheet.id)
  return (
    <button
      type="button"
      {...(role
        ? { role: 'menuitemcheckbox', 'aria-checked': guide.isGuide }
        : { 'aria-pressed': guide.isGuide })}
      disabled={!guide.isKnown}
      onClick={() => void guide.toggle()}
      className={className}
      title="Agents connected over MCP read this page first"
    >
      <IconRobot className="size-4 text-muted-foreground" />
      <span className="flex-1">Agent guide</span>
      {guide.isGuide && <span className="text-[12px] text-muted-foreground">On</span>}
    </button>
  )
}
