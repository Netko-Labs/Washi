import type { BlockProps } from '../../../lib/types'

export interface OptionProps extends BlockProps {
  title: string
  pick?: boolean
}

export interface QuestionProps extends BlockProps {
  title: string
}

export interface CountdownProps extends BlockProps {
  to: string
  label?: string
}

export type CountdownWhen = 'ahead' | 'today' | 'past'

/** How far `to` is, as the figure and its unit the countdown draws. */
export interface CountdownView {
  when: CountdownWhen
  figure: string
  unit: string
}
