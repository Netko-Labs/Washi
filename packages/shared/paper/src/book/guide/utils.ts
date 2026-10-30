import {
  domDiagnostics,
  EXPR_LIMITS,
  EXPR_MAX_SOURCE_LENGTH,
  hasErrors,
  parse,
  validate,
  WsxParseError,
} from '@washi/wsx'
import { z } from 'zod'
import { CLASS_ALLOWLIST, paperRegistry } from '../../registry'
import { knobsFor } from '../knobs'
import type { CheckDef, CompiledSheet, Limit, Placement, PropRow } from './types'
import { PROP_TYPES } from './values'

function bareOf(schema: z.core.$ZodType): z.core.$ZodType {
  let inner = schema
  while (
    inner instanceof z.ZodOptional ||
    inner instanceof z.ZodDefault ||
    inner instanceof z.ZodNullable
  ) {
    inner = inner instanceof z.ZodDefault ? inner.def.innerType : inner.unwrap()
  }
  return inner
}

function bounds(schema: z.core.$ZodType, unit: string): string {
  let min: number | undefined
  let max: number | undefined
  for (const check of schema._zod.def.checks ?? []) {
    const def = check._zod.def as CheckDef
    if (def.check === 'min_length') min = def.minimum
    if (def.check === 'max_length') max = def.maximum
    if (def.check === 'greater_than' && typeof def.value === 'number') min = def.value
    if (def.check === 'less_than' && typeof def.value === 'number') max = def.value
  }
  if (min !== undefined && max !== undefined && (unit === 'number' || min > 1))
    return `${unit} ${min}–${max}`
  if (max !== undefined) return `${unit} ≤ ${max}`
  return unit
}

/** A registry schema that names what it holds — `column`, `state key` — says so instead of `text`. */
function described(schema: z.core.$ZodType): string | undefined {
  return schema instanceof z.ZodType ? schema.description : undefined
}

function typeOf(schema: z.core.$ZodType, options: readonly (string | number)[]): string {
  if (options.length > 0) return options.join(' · ')
  const inner = bareOf(schema)
  if (inner instanceof z.ZodBoolean) return 'true · false'
  if (inner instanceof z.ZodNumber) return bounds(inner, 'number')
  const named = described(inner)
  if (named) return named
  if (inner instanceof z.ZodString) return bounds(inner, 'text')
  if (inner instanceof z.ZodArray) {
    const element = described(bareOf(inner.element))
    return bounds(inner, element ? `list of ${element}s` : 'list')
  }
  if (inner instanceof z.ZodUnion) return 'one of several shapes'
  return 'object'
}

/** A primitive's props in words, read off its zod spec: the reference can never drift from it. */
export function propRows(name: string): PropRow[] {
  const spec = paperRegistry.components[name]
  if (!spec || !(spec.props instanceof z.ZodObject)) return []
  const shape = spec.props.shape as Record<string, z.core.$ZodType>
  return knobsFor(name).map((knob) => {
    const schema = shape[knob.key]
    return {
      key: knob.key,
      type: PROP_TYPES[knob.key] ?? (schema ? typeOf(schema, knob.options) : 'object'),
      required: knob.required,
      styled: knob.styled,
    }
  })
}

export function placementOf(name: string): Placement {
  const spec = paperRegistry.components[name]
  return {
    children: spec?.children ?? 'none',
    within: spec?.within ?? [],
    unique: Boolean(spec?.unique),
    noNest: Boolean(spec?.noNest),
  }
}

/** Every rule a page lives under, with the numbers the validator and the renderer enforce. */
export function pageLimits(): Limit[] {
  const budget = paperRegistry.budget ?? { nodes: 400, binds: 8, exprs: 24 }
  const placed = Object.entries(paperRegistry.components)
    .filter(([, spec]) => spec.within)
    .map(([name, spec]) => `${name} in ${spec.within?.join(' or ')}`)
  const unique = Object.entries(paperRegistry.components)
    .filter(([, spec]) => spec.unique)
    .map(([name]) => name)
  return [
    {
      title: 'Closed registry',
      detail: `Only these ${Object.keys(paperRegistry.components).length} primitives exist. Anything else is refused; Missing stands in for what is not here yet and files the request.`,
    },
    {
      title: 'Size of a page',
      detail: `Past ${budget.nodes} blocks, ${budget.binds} data bindings or ${budget.exprs} expressions the page is asked to split — a warning, not a refusal.`,
    },
    {
      title: 'Expressions',
      detail: `At most ${EXPR_MAX_SOURCE_LENGTH} characters, ${EXPR_LIMITS.depth} levels deep and ${EXPR_LIMITS.budget} steps. Arithmetic, comparisons, and/or/not, aggregates over a table (count, sum, avg, min, max with where), now, days, month, year, when, add_months. No functions, loops, regex or formatting.`,
    },
    {
      title: 'Page state',
      detail:
        'A state value is text, a number, true/false or empty — never a list or an object. Controls write keys, expressions read them; today every key resets when the page reopens.',
    },
    {
      title: 'Looks',
      detail:
        'Appearance is four enums — variant, tone, size, emphasis — plus span inside a Grid. No colours, pixels, fonts or margins; a page never pins light or dark.',
    },
    {
      title: 'Layout tokens',
      detail: `class takes layout tokens only: ${[...CLASS_ALLOWLIST].join(' ')}.`,
    },
    {
      title: 'Width',
      detail:
        'Only Board, Agenda, Table, Database, Roadmap, Chart, Canvas and Grid take width (page · wide · full). Text always keeps its reading measure; inside a Card or Grid a wide block stays in the box.',
    },
    {
      title: 'Placement',
      detail: `${placed.join('; ')}. Once per page: ${unique.join(', ')}. Repeat never nests.`,
    },
    {
      title: 'Widgets',
      detail:
        'A Widget draws one of the page’s own components with React in a frame with no origin and no network: div, svg, canvas and refs are its alone. It reads and writes only through washi’s hooks, writes from a press inside it, and runs only where an owner turned widgets on.',
    },
    {
      title: 'Terminals',
      detail:
        'A Terminal runs Node-style JS in a widget’s frame, only from a press: its files are uploads read as the reader (up to 32 MB each unless the server says otherwise), held in memory with what it writes. Node’s fs, path, events, util, os, buffer, timers, url and assert are lent; no network, child process or real disk.',
    },
    {
      title: 'Actions',
      detail:
        'Actions are objects naming a verb: sheet.open, sheet.create, table.insert, table.update, table.reorder, table.copy, table.delete, state.set. Opening outside links from a page is refused; images are https only.',
    },
    {
      title: 'Data',
      detail:
        'A bind is a query over one table: where, orderBy, limit, groupBy, params. An Agenda reads up to 500 rows a span, a copy writes up to 500, a formula filter finishes over up to 5000. Forms write stored columns only — never a formula or rollup.',
    },
    {
      title: 'Nothing runs',
      detail:
        'A page is inert data: no scripts, no handlers, no hooks. state, expr, bind and action are its whole behaviour, checked before it is saved and before it is drawn.',
    },
  ]
}

/** The server's own gates, client-side: parse, then validate against the registry. */
export function compileSheet(source: string): CompiledSheet {
  try {
    const root = parse(source)
    const diagnostics = [...validate(root, paperRegistry), ...domDiagnostics(root)]
    const errors = diagnostics.filter((d) => d.severity === 'error').map((d) => d.message)
    return { root: hasErrors(diagnostics) ? null : root, errors }
  } catch (cause) {
    const errors =
      cause instanceof WsxParseError ? cause.diagnostics.map((d) => d.message) : [String(cause)]
    return { root: null, errors }
  }
}
