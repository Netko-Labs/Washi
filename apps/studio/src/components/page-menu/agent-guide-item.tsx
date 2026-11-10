import { IconRobot } from '@tabler/icons-react'
import { useIsSteward } from '@/components/settings/shared/stewardship'
import type { AgentGuideItemProps } from './lib'
import { useAgentGuide } from './lib'

/**
 * "Agent guide": the page outside agents read first (D135), as CLAUDE.md is for a repo — its words
 * lead their instructions and `context_get`. One page a workspace, an owner's or an admin's to
 * move, so only they see the row; a row's page is never the guide.
 */
export function AgentGuideItem(props: AgentGuideItemProps) {
  const isSteward = useIsSteward()
  return isSteward && !props.sheet.rowOf ? <AgentGuideToggle {...props} /> : null
}

function AgentGuideToggle({ sheet, className, role }: AgentGuideItemProps) {
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
      title={guide.error ?? 'Agents connected over MCP read this page first'}
    >
      <IconRobot className="size-4 text-muted-foreground" />
      <span className="flex-1">
        Agent guide
        {guide.error && (
          <span role="alert" className="block text-[12px] text-destructive">
            {guide.error}
          </span>
        )}
      </span>
      {guide.isGuide && <span className="text-[12px] text-muted-foreground">On</span>}
    </button>
  )
}
