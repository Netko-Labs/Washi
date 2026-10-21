import { paperRegistry } from '@washi/paper/registry'
import { z } from 'zod'
import type { KnobDef, KnobKind } from './types'
import { STYLED_KEYS } from './values'

function unwrap(schema: z.core.$ZodType): { inner: z.core.$ZodType; required: boolean } {
  let inner = schema
  let required = true
  for (;;) {
    if (inner instanceof z.ZodOptional) {
      inner = inner.unwrap()
      required = false
    } else if (inner instanceof z.ZodDefault) {
      inner = inner.def.innerType
      required = false
    } else if (inner instanceof z.ZodNullable) {
      inner = inner.unwrap()
    } else {
      return { inner, required }
    }
  }
}

function literalValues(schema: z.core.$ZodType): (string | number)[] | null {
  if (schema instanceof z.ZodEnum) return Object.values(schema.enum)
  if (schema instanceof z.ZodLiteral) {
    return schema.def.values.filter((v): v is string | number => typeof v !== 'boolean')
  }
  if (schema instanceof z.ZodUnion) {
    const branches = schema.options.map(literalValues)
    if (branches.every((branch) => branch !== null)) return branches.flat()
  }
  return null
}

function kindOf(schema: z.core.$ZodType): { kind: KnobKind; options: (string | number)[] } {
  const options = literalValues(schema)
  if (options) return { kind: 'enum', options }
  if (schema instanceof z.ZodBoolean) return { kind: 'boolean', options: [] }
  if (schema instanceof z.ZodNumber) return { kind: 'number', options: [] }
  if (schema._zod.def.type === 'string') return { kind: 'text', options: [] }
  return { kind: 'json', options: [] }
}

/** The knobs a primitive exposes, read off its zod spec — never hand-listed. */
export function knobsFor(name: string): KnobDef[] {
  const spec = paperRegistry.components[name]
  if (!spec || !(spec.props instanceof z.ZodObject)) return []
  return Object.entries(spec.props.shape).map(([key, schema]) => {
    const { inner, required } = unwrap(schema)
    return { key, ...kindOf(inner), required, styled: STYLED_KEYS.has(key) }
  })
}
