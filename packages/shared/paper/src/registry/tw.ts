import { z } from 'zod'

/**
 * `class` props carry the full Tailwind vocabulary — arbitrary values,
 * gradients, variants — compiled at runtime by the app's Tailwind engine
 * (spec Q9, revised). Styling is expression, not execution; the only CSS
 * capability that can touch the network is `url()`, so it is banned along
 * with tokens that could break out of a property-value context.
 */

const TOKEN_SHAPE = /^[^\s"'`\\{};]+$/
const BANNED = /url\s*\(|image-set\s*\(|@import|expression\s*\(/i

export function invalidClasses(value: string): string[] {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => token.length > 128 || !TOKEN_SHAPE.test(token) || BANNED.test(token))
}

/** Space-separated utilities: any Tailwind, no url()/quotes/braces. */
export const zClass = z
  .string()
  .max(1000)
  .refine((value) => invalidClasses(value).length === 0, {
    error: (issue) =>
      `class contains forbidden tokens: ${invalidClasses(String(issue.input)).join(' ')}`,
  })
  .optional()
