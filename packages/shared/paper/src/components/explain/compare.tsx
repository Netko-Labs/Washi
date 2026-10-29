import { styled } from '../../lib'
import type { BlockProps } from '../../lib/types'
import type { OptionProps } from './lib'

/** Options side by side, one column each; they stack when the sheet is narrow. */
export function Compare({ children, ...rest }: BlockProps) {
  return <div {...styled(rest, 'wsx-compare')}>{children}</div>
}

export function Option({ title, pick, children, ...rest }: OptionProps) {
  return (
    <section {...styled(rest, 'wsx-option')} data-pick={pick || undefined}>
      <header className="wsx-option-head">
        <h3 className="wsx-option-title">{title}</h3>
        {pick && <span className="wsx-option-pick">Pick</span>}
      </header>
      <div className="wsx-option-body">{children}</div>
    </section>
  )
}
