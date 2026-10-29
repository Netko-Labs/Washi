import { useId } from 'react'
import { styled } from '../../lib'
import type { BlockProps } from '../../lib/types'
import { FaqContext, type QuestionProps, useFaqName } from './lib'

/** Questions that open one at a time: the browser closes the rest of a `name` group. */
export function Faq({ children, ...rest }: BlockProps) {
  const name = useId()
  return (
    <div {...styled(rest, 'wsx-faq')}>
      <FaqContext.Provider value={name}>{children}</FaqContext.Provider>
    </div>
  )
}

export function Question({ title, children, ...rest }: QuestionProps) {
  const name = useFaqName()
  return (
    <details {...styled(rest, 'wsx-question')} name={name}>
      <summary>{title}</summary>
      <div className="wsx-question-body">{children}</div>
    </details>
  )
}
