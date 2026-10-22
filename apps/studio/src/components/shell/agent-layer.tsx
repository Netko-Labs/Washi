import { AgentFab, AgentPanel, useAgentStore } from '@washi/ui'
import type { AgentLayerProps } from './lib'

export function AgentLayer({ fab = true }: AgentLayerProps) {
  const panelOpen = useAgentStore((state) => state.panelOpen)
  return (
    <>
      {fab && <AgentFab />}
      {panelOpen && <AgentPanel />}
    </>
  )
}
