import { styled } from '../../lib'
import type { BlockProps, StepProps } from '../../lib/types'
import { StepsContext, useInSteps } from './lib'

/** A numbered how-to: each Step's number is drawn here, a rail runs between them. */
export function Steps({ children, ...rest }: BlockProps) {
  return (
    <ol {...styled(rest, 'wsx-steps')}>
      <StepsContext.Provider value={true}>{children}</StepsContext.Provider>
    </ol>
  )
}

export function Timeline({ children, ...rest }: BlockProps) {
  return (
    <ol {...styled(rest, 'wsx-timeline')}>
      <StepsContext.Provider value={false}>{children}</StepsContext.Provider>
    </ol>
  )
}

/** On a Timeline the marker is the page's; inside Steps the number is drawn unless one is named. */
export function Step({ marker, title, children, ...rest }: StepProps) {
  const isNumbered = useInSteps()
  if (isNumbered) {
    return (
      <li {...styled(rest, 'wsx-steps-item')} data-marked={marker ? true : undefined}>
        <span className="wsx-steps-marker">{marker}</span>
        <div className="wsx-steps-content">
          <div className="wsx-steps-title">{title}</div>
          <div className="wsx-steps-body">{children}</div>
        </div>
      </li>
    )
  }
  return (
    <li {...styled(rest, 'wsx-step')}>
      <span className="wsx-step-marker">{marker}</span>
      <div>
        {title && <div className="wsx-step-title">{title}</div>}
        <div className="wsx-step-body">{children}</div>
      </div>
    </li>
  )
}
