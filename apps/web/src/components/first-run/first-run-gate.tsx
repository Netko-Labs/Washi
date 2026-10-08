import { FirstRun } from './first-run'
import { type FirstRunGateProps, useFirstRun } from './lib'

export function FirstRunGate({ workspace, children }: FirstRunGateProps) {
  const { show, skip, done } = useFirstRun(workspace.id)
  if (!show) return children
  return <FirstRun workspace={workspace} onDone={done} onSkip={skip} />
}
