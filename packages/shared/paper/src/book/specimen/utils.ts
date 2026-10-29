import { parse, serialize, type WsxElement, type WsxNode, type WsxValue } from '@washi/wsx'
import { z } from 'zod'
import { paperRegistry, TONES, VARIANTS } from '../../registry'
import type { MatrixAxes, PageInput, SpecimenInput } from './types'
import { SPECIMEN_STATE, SPECIMENS } from './values'

const BOUND_KEYS = ['bind', 'history', 'table']

function innerNodes(wsx: string): WsxNode[] {
  return parse(`<Wrap>${wsx}</Wrap>`).children
}

/** A text child spelled as a WSX literal, {`…`}: parsed, so the literal's own marks stay out. */
const isTemplateLiteral = (text: string) => text.startsWith('{`') && text.endsWith('`}')

function element(name: string, props: Record<string, WsxValue>, children?: string): WsxElement {
  const spec = paperRegistry.components[name]
  const policy = spec?.children ?? 'none'
  const kids =
    policy === 'none' || children === undefined || children === ''
      ? []
      : policy === 'text' && !isTemplateLiteral(children)
        ? [{ kind: 'text' as const, value: children }]
        : innerNodes(children)
  return { kind: 'element', name, props, children: kids }
}

function body(name: string, props: Record<string, WsxValue>, children?: string): string {
  const specimen = SPECIMENS[name] ?? {}
  const wsx = serialize(element(name, props, children)).trimEnd()
  return specimen.wrap ? specimen.wrap.replace('<Here />', wsx) : wsx
}

function sheet(input: SpecimenInput, inner: string): string {
  const root: WsxElement = {
    kind: 'element',
    name: 'Sheet',
    props: {
      title: `Mihon · ${input.name}`,
      theme: input.theme,
      feel: input.feel,
      accent: input.accent,
      state: { local: SPECIMEN_STATE },
      wsx: '1',
    },
    children: innerNodes(inner),
  }
  return serialize(root)
}

/** The specimen's props with the knobs on top; an undefined knob falls back, a null one clears. */
export function specimenProps(
  name: string,
  knobs: Record<string, WsxValue>,
): Record<string, WsxValue> {
  const out: Record<string, WsxValue> = { ...(SPECIMENS[name]?.props ?? {}) }
  for (const [key, value] of Object.entries(knobs)) {
    if (value === null) delete out[key]
    else out[key] = value
  }
  return out
}

export function specimenChildren(name: string, childrenText: string | null): string | undefined {
  return childrenText ?? SPECIMENS[name]?.children
}

/** The whole page the stage renders: one Sheet, the specimen inside, wrapped if it must be. */
export function specimenSource(input: SpecimenInput): string {
  const props = specimenProps(input.name, input.knobs)
  const children = specimenChildren(input.name, input.childrenText)
  return sheet(input, body(input.name, props, children))
}

/** variant × tone; variant only when it binds (a sheet allows 8 binds); none for a unique one. */
export function matrixAxes(name: string): MatrixAxes {
  const spec = paperRegistry.components[name]
  if (!spec || spec.unique || !(spec.props instanceof z.ZodObject)) return null
  if (!('variant' in spec.props.shape)) return null
  const keys = Object.keys(spec.props.shape)
  return keys.some((key) => BOUND_KEYS.includes(key)) ? ['variant'] : ['variant', 'tone']
}

export function matrixSource(input: SpecimenInput): string | null {
  const axes = matrixAxes(input.name)
  if (!axes) return null
  const props = specimenProps(input.name, input.knobs)
  const children = specimenChildren(input.name, input.childrenText)
  const tones = axes.length === 2 ? TONES : (['neutral'] as const)
  const sections = VARIANTS.map((variant) => {
    const cells = tones.map((tone) => {
      const cell = body(input.name, { ...props, variant, tone }, children)
      const label = axes.length === 2 ? `${variant} · ${tone}` : variant
      return `<Stack span={${axes.length === 2 ? 4 : 12}} gap="tight"><Text size="sm" emphasis="quiet">${label}</Text>${cell}</Stack>`
    })
    return `<Section title="${variant}"><Grid gap="tight">${cells.join('')}</Grid></Section>`
  })
  return sheet(input, sections.join(''))
}

/** What the stage renders for the book's view: the specimen, its matrix, or the scratch text. */
export function pageSource(book: PageInput): string {
  if (book.view === 'scratch' && book.scratch !== null) return book.scratch
  if (book.view === 'matrix') return matrixSource(book) ?? specimenSource(book)
  return specimenSource(book)
}
