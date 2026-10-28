export type KnobKind = 'enum' | 'boolean' | 'number' | 'text' | 'json'

export interface KnobDef {
  key: string
  kind: KnobKind
  options: readonly (string | number)[]
  required: boolean
  /** One of the four enums or the two layout tokens every primitive takes. */
  styled: boolean
}
