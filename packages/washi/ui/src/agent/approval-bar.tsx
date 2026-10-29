import { ApprovalCard } from '../approval'
import { useAgentStore } from '../stores'

export function ApprovalBar() {
  const approvals = useAgentStore((state) => state.approvals)
  const next = approvals[0]
  if (!next) return null

  return (
    <div className="mx-3 mb-2" data-approval-bar>
      <ApprovalCard
        key={next.id}
        toolName={next.toolName}
        input={next.input}
        more={approvals.length - 1}
        onDecide={(decision) => useAgentStore.getState().resolveApproval(next.id, decision)}
      />
    </div>
  )
}
