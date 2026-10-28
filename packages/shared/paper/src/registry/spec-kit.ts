import type { ComponentSpec } from '@washi/wsx'
import type { z } from 'zod'
import { styledSchema } from './surface'

/** A primitive's spec: the styled enums plus its own props, nothing else accepted. */
export const p = (
  shape: z.ZodRawShape,
  children: ComponentSpec['children'],
  rest?: Omit<ComponentSpec, 'props' | 'children'>,
): ComponentSpec => ({
  props: styledSchema.extend(shape).strict(),
  children,
  ...rest,
})
