import { z } from 'zod'

/**
 * The curated Tailwind allowlist (spec Q9). Sheets style through `class` props
 * validated against these patterns; the matching utilities are pre-generated
 * into the app stylesheet via safelist.txt. Closed by construction — no
 * arbitrary values, no runtime compiler.
 */

const SCALE = '(?:0|0\\.5|1|1\\.5|2|2\\.5|3|4|5|6|8|10|12|16|20|24)'
const COLOR =
  '(?:background|foreground|card|muted|muted-foreground|primary|accent|destructive|border)'

const CLASS_PATTERNS: RegExp[] = [
  new RegExp(`^-?m[trblxy]?-${SCALE}$`),
  new RegExp(`^p[trblxy]?-${SCALE}$`),
  new RegExp(`^gap(?:-[xy])?-${SCALE}$`),
  new RegExp(`^space-[xy]-${SCALE}$`),
  new RegExp(`^[wh]-(?:${SCALE}|32|40|48|64|full|auto|fit|px)$`),
  /^(?:min|max)-w-(?:full|fit|none|xs|sm|md|lg|xl|2xl)$/,
  /^text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)$/,
  /^text-(?:left|center|right)$/,
  new RegExp(`^text-${COLOR}$`),
  /^(?:bg|text|border)-tape-(?:pink|teal|blue|mustard|violet|moss|slate)$/,
  /^font-(?:normal|medium|semibold|bold)$/,
  /^font-(?:sans|display|serif|rounded|mono)$/,
  /^(?:italic|underline|line-through|truncate|uppercase|lowercase|capitalize)$/,
  /^leading-(?:none|tight|snug|normal|relaxed)$/,
  /^tracking-(?:tight|normal|wide)$/,
  new RegExp(`^bg-${COLOR}$`),
  new RegExp(`^border(?:-[trbl])?(?:-${COLOR})?$`),
  /^border-(?:0|2|4|dashed|dotted)$/,
  /^rounded(?:-(?:sm|md|lg|xl|2xl|full|none))?$/,
  /^shadow(?:-(?:sm|md|lg|none))?$/,
  /^(?:flex|inline-flex|grid|block|inline-block|hidden)$/,
  /^flex-(?:row|col|wrap|nowrap|1|auto|none)$/,
  /^(?:grow|shrink)(?:-0)?$/,
  /^items-(?:start|center|end|stretch|baseline)$/,
  /^justify-(?:start|center|end|between|around|evenly)$/,
  /^self-(?:start|center|end|stretch)$/,
  /^grid-cols-(?:1|2|3|4|5|6|12)$/,
  /^col-span-(?:1|2|3|4|5|6|full)$/,
  /^(?:overflow|overflow-[xy])-(?:auto|hidden|scroll|visible)$/,
  /^opacity-(?:25|50|75|100)$/,
  /^list-(?:none|disc|decimal|inside|outside)$/,
]

export function invalidClasses(value: string): string[] {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !CLASS_PATTERNS.some((pattern) => pattern.test(token)))
}

/** `class` prop: space-separated utilities, every token on the allowlist. */
export const zClass = z
  .string()
  .max(400)
  .refine((value) => invalidClasses(value).length === 0, {
    error: (issue) =>
      `class contains utilities outside the allowlist: ${invalidClasses(String(issue.input)).join(' ')}`,
  })
  .optional()
