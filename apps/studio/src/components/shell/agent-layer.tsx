import { AgentFab, AgentPanel, useAgentStore } from '@washi/ui'

export function AgentLayer() {
  const panelOpen = useAgentStore((state) => state.panelOpen)
  return (
    <>
      <AgentFab />
      {panelOpen && <AgentPanel />}
    </>
  )
}
