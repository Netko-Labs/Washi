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

/**
 * Viewport breakpoints are banned the way `url()` is (spec Q16). A sheet renders
 * in a tab, a 400px agent popover and — eventually — a phone; two of those are
 * not the window. Container variants (`@sm:`, `@md:`) are the vocabulary, and
 * `<Sheet>` is the container.
 */
const VIEWPORT_VARIANT = /(?:^|:)(?:sm|md|lg|xl|2xl):/

export function invalidClasses(value: string): string[] {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .filter(
      (token) =>
        token.length > 128 ||
        !TOKEN_SHAPE.test(token) ||
        BANNED.test(token) ||
        VIEWPORT_VARIANT.test(token),
    )
}

/** Space-separated utilities: any Tailwind, no url()/quotes/braces, no breakpoints. */
export const zClass = z
  .string()
  .max(1000)
  .refine((value) => invalidClasses(value).length === 0, {
    error: (issue) =>
      `class contains forbidden tokens: ${invalidClasses(String(issue.input)).join(' ')} — sheets size to their container (@sm:, @md:), never the viewport`,
  })
  .optional()
