import { AsleepNote } from './asleep-note'
import { FirstRun } from './first-run'
import { type FirstRunGateProps, mayGiveKey, useFirstRun } from './lib'

export function FirstRunGate({ workspace, children }: FirstRunGateProps) {
  const { show, skip, done } = useFirstRun(workspace.id)
  if (!show) return children
  if (!mayGiveKey(workspace.role)) return <AsleepNote workspace={workspace} onSkip={skip} />
  return <FirstRun workspace={workspace} onDone={done} onSkip={skip} />
}
