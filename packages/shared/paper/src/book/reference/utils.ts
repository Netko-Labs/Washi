import { nearestNames, PRIMITIVE_GROUPS, paperRegistry, TONES, VARIANTS } from '../../registry'
import { EMPHASES, FEELS, GAPS, SIZES, THEME_IDS, WIDTHS } from '../../registry/surface'
import { pageLimits, placementOf, propRows, SUMMARIES } from '../guide'
import { SPECIMENS, specimenBlock } from '../specimen'
import type { PrimitiveDetail, PrimitiveLine, WsxDetails, WsxIndex } from './types'
import { ALSO, CHILDREN_WORDS, NEXT, START, STYLED_WORDS, WRITING } from './values'

const GROUP_OF = new Map(
  Object.entries(PRIMITIVE_GROUPS).flatMap(([group, names]) =>
    (names as readonly string[]).map((name) => [name, group] as const),
  ),
)

const ownProps = (name: string) => propRows(name).filter((row) => !row.styled)

function line(name: string): PrimitiveLine {
  return {
    name,
    group: GROUP_OF.get(name) ?? 'other',
    summary: SUMMARIES[name] ?? '',
    children: CHILDREN_WORDS[placementOf(name).children],
    props: ownProps(name)
      .map((row) => (row.required ? `${row.key}*` : row.key))
      .join(' '),
  }
}

function detail(name: string): PrimitiveDetail {
  const placement = placementOf(name)
  const code = SPECIMENS[name]?.code
  return {
    ...line(name),
    within: placement.within,
    oncePerPage: placement.unique,
    props: ownProps(name).map(({ key, type, required }) => ({ key, type, required })),
    example: specimenBlock(name),
    ...(ALSO[name] ? { also: ALSO[name] } : {}),
    ...(code ? { code } : {}),
  }
}

/** Every primitive in one line each, with the rules a page lives under: where an agent starts. */
export function wsxIndex(): WsxIndex {
  return {
    start: START,
    writing: WRITING,
    looks: {
      variant: VARIANTS,
      tone: TONES,
      size: SIZES,
      emphasis: EMPHASES,
      gap: GAPS,
      width: WIDTHS,
      feel: FEELS,
      theme: THEME_IDS,
    },
    rules: pageLimits(),
    primitives: Object.keys(paperRegistry.components).map(line),
    next: NEXT,
  }
}

/** The named primitives in full; a name the registry lacks comes back with the nearest it has. */
export function wsxDetails(names: string[]): WsxDetails {
  const known = Object.keys(paperRegistry.components)
  const unknown = names
    .filter((name) => !known.includes(name))
    .map((name) => ({ name, nearest: nearestNames(name, known) }))
  return {
    styled: STYLED_WORDS,
    primitives: names.filter((name) => known.includes(name)).map(detail),
    ...(unknown.length > 0 ? { unknown } : {}),
  }
}
