import { styled } from '../../lib'
import { type CountdownProps, countdownOf, useMinuteClock } from './lib'

/** Days left to `to` on the reader's clock, or hours once under two days. */
export function Countdown({ to, label, ...rest }: CountdownProps) {
  const now = useMinuteClock()
  const view = now === null ? null : countdownOf(to, now)
  return (
    <div {...styled(rest, 'wsx-countdown')} data-when={view?.when}>
      <time className="wsx-countdown-figure" dateTime={to}>
        {view ? view.figure : '—'}
        {view?.unit && <span className="wsx-countdown-unit">{view.unit}</span>}
      </time>
      {label && <div className="wsx-countdown-label">{label}</div>}
    </div>
  )
}
