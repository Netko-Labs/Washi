import { z } from 'zod'
import type { Capability } from './types'

/** A capability whose `run` receives its input already checked against `input`. */
export function capability<Shape extends z.ZodRawShape>(
  name: string,
  description: string,
  input: Shape,
  isReadOnly: boolean,
  run: (input: z.output<z.ZodObject<Shape>>) => unknown,
): Capability {
  const schema = z.object(input)
  return {
    name,
    description,
    input,
    isReadOnly,
    run: async (raw) => run(schema.parse(raw ?? {})),
  }
}
