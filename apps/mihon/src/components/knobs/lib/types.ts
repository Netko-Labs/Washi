import type { KnobDef } from '@washi/paper/book'
import type { WsxValue } from '@washi/wsx'

export interface KnobFieldProps {
  def: KnobDef
  value: WsxValue | undefined
  /** `undefined` restores the specimen's default; `null` clears the prop. */
  onChange(value: WsxValue | null | undefined): void
  overridden: boolean
}

export interface SegmentsProps {
  options: readonly (string | number)[]
  active: WsxValue | undefined
  onPick(value: string | number | null): void
}
