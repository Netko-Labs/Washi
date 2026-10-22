import { AgentFab, AgentPanel, useAgentStore } from '@washi/ui'
import type { AgentLayerProps } from './lib'

export function AgentLayer({ fab = true, placement = 'float' }: AgentLayerProps) {
  const panelOpen = useAgentStore((state) => state.panelOpen)
  return (
    <>
      {fab && (placement !== 'dock' || !panelOpen) && <AgentFab />}
      {panelOpen && <AgentPanel placement={placement} />}
    </>
  )
}
