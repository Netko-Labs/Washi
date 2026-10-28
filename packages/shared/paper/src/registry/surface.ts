import { z } from 'zod'

/** The entire visual API a page can address (spec §9). */
export const VARIANTS = ['plain', 'outline', 'filled', 'raised', 'tape'] as const
export const TONES = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'] as const
export const SIZES = ['sm', 'md', 'lg'] as const
export const EMPHASES = ['quiet', 'normal', 'strong'] as const
export const GAPS = ['tight', 'normal', 'loose'] as const
export const FEELS = ['note', 'editorial', 'board', 'deck'] as const
/** How far a wide block reaches past the text column: not at all, a little, to the sheet's edges. */
export const WIDTHS = ['page', 'wide', 'full'] as const
export const THEME_IDS = [
  'washi',
  'sumi',
  'aizome',
  'matcha',
  'kobai',
  'kraft',
  'yukiwa',
  'yozora',
  'catppuccin',
  'rose-pine',
  'nord',
  'gruvbox',
  'tokyo-night',
  'kanagawa',
  'everforest',
] as const

export const variantSchema = z.enum(VARIANTS)
export const toneSchema = z.enum(TONES)
export const sizeSchema = z.enum(SIZES)
export const emphasisSchema = z.enum(EMPHASES)
export const gapSchema = z.enum(GAPS)
export const feelSchema = z.enum(FEELS)
export const widthSchema = z.enum(WIDTHS)
export const themeIdSchema = z.enum(THEME_IDS)
/** A theme the workspace made is `ws:<slug>`; the host lends its tokens. */
export const WORKSPACE_THEME_KEY = /^ws:[a-z0-9-]{1,40}$/
export const sheetThemeSchema = z
  .string()
  .refine(
    (key) => (THEME_IDS as readonly string[]).includes(key) || WORKSPACE_THEME_KEY.test(key),
    { message: `a theme is ${THEME_IDS.join(' · ')}, or ws:<name> for one the workspace made` },
  )

const FLOW = ['row', 'col', 'wrap', 'nowrap', 'grid-2', 'grid-3', 'grid-4']
const SPACING = [
  'gap-0',
  'gap-tight',
  'gap-normal',
  'gap-loose',
  'p-0',
  'p-1',
  'p-2',
  'p-3',
  'p-4',
  'p-6',
  'p-8',
]
const ALIGN = [
  'items-start',
  'items-center',
  'items-end',
  'items-stretch',
  'items-baseline',
  'justify-start',
  'justify-center',
  'justify-end',
  'justify-between',
  'text-left',
  'text-center',
  'text-right',
]
const SIZING = ['grow', 'none', 'full']
const CONTAINER = [
  '@sm:row',
  '@sm:col',
  '@sm:grid-2',
  '@sm:grid-3',
  '@md:row',
  '@md:col',
  '@md:grid-2',
  '@md:grid-3',
  '@md:grid-4',
  '@lg:row',
  '@lg:grid-3',
  '@lg:grid-4',
]

/** Layout-only tokens. Colour, type, border and radius are not addressable here — ever. */
export const CLASS_ALLOWLIST = new Set([...FLOW, ...SPACING, ...ALIGN, ...SIZING, ...CONTAINER])

const STYLE_HINTS: [RegExp, string][] = [
  [
    /^(font-|text-(xs|sm|base|lg|xl|\dxl|\[)|leading-|tracking-|uppercase|italic)/,
    'type is not addressable in class — use size or emphasis',
  ],
  [
    /^(bg-|text-|border-|from-|to-|via-|fill-|stroke-)/,
    'colour is not addressable in class — use tone',
  ],
  [/^(rounded|shadow|ring)/, 'radius and shadow belong to variant'],
  [/^(m[trblxy]?-|space-)/, 'rhythm belongs to the parent — use Section, Stack or gap'],
  [/^(w-|h-|max-w|min-w|max-h|min-h)/, 'measure belongs to the Sheet — use span inside Grid'],
  [
    /^(sm|md|lg|xl|2xl):/,
    'viewport breakpoints are banned — use @sm: @md: @lg: (the page measures itself)',
  ],
  [/\[.*\]/, 'arbitrary values are not addressable'],
]

export function classProblems(value: string): string[] {
  const out: string[] = []
  for (const token of value.split(/\s+/).filter(Boolean)) {
    if (CLASS_ALLOWLIST.has(token)) continue
    const hint = STYLE_HINTS.find(([pattern]) => pattern.test(token))?.[1]
    out.push(`"${token}" — ${hint ?? 'not a layout token'}`)
  }
  return out
}

export const zClass = z
  .string()
  .max(400)
  .refine((value) => classProblems(value).length === 0, {
    error: (issue) => classProblems(String(issue.input)).join('; '),
  })
  .optional()

/** Every primitive accepts the four enums plus the two layout tokens. */
export const styledSchema = z.object({
  variant: variantSchema.optional(),
  tone: toneSchema.optional(),
  size: sizeSchema.optional(),
  emphasis: emphasisSchema.optional(),
  span: z.number().int().min(1).max(12).optional(),
  class: zClass,
})

/** Props a page reaches for that live one level up; validation names the alternative. */
export const STYLE_PROP_HINTS: Record<string, string> = {
  color: 'use tone',
  colour: 'use tone',
  bg: 'use variant or tone',
  background: 'use variant or tone',
  style: 'style is not addressable — use variant · tone · size · emphasis',
  className: 'the prop is class, and it takes layout tokens only',
  font: 'type is selected by role — Title level, Text size',
  fontSize: 'use size',
  weight: 'use emphasis',
  width:
    'only wide blocks take width (page · wide · full): Board Agenda Table Database Roadmap Chart Canvas Grid Columns Bento — elsewhere use span inside Grid',
  height: 'not addressable',
  margin: 'rhythm belongs to the parent — use Section, Stack or gap',
  padding: 'padding belongs to the component — use size',
  radius: 'radius belongs to variant',
  shadow: 'elevation belongs to variant',
  onClick: 'interaction is a prop, not a handler — use action',
  onChange: 'interaction is a prop, not a handler — use action or state',
  when: 'use expr',
  equals: 'use expr',
  preset: 'use theme',
  accent: 'use tone (accent is a Sheet prop)',
}
