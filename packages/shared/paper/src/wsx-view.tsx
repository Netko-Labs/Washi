import type { WsxElement, WsxNode } from '@washi/wsx'
import type { CSSProperties, ReactNode } from 'react'
import { Board, Table, Task, TaskList } from './components/data'
import { Card, Chip, Hero, Stamp, Stat, Step, Tape, Timeline } from './components/display'
import { Button, Column, Columns, Fetch, Img, Ref, Toggle } from './components/interactive'
import { SHEET_PRESETS, type SheetPreset } from './components/themes'
import { Callout, Code, Divider, H1, H2, H3, P, Quote, Tag } from './components/typography'

const THEME_FACES: Record<string, string> = {
  gothic: 'font-display',
  serif: 'font-serif',
  rounded: 'font-rounded',
  mono: 'font-mono',
}

const THEME_PAPERS: Record<string, CSSProperties> = {
  plain: {},
  dots: {
    backgroundImage:
      'radial-gradient(color-mix(in oklab, var(--foreground) 6%, transparent) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
  },
  lines: {
    backgroundImage:
      'repeating-linear-gradient(0deg, transparent 0 27px, color-mix(in oklab, var(--foreground) 7%, transparent) 27px 28px)',
  },
}

export interface SheetTheme {
  preset?: SheetPreset
  accent?: string
  face?: string
  paper?: string
}

function sheetStyle(theme: SheetTheme | undefined, classProp: string | undefined): CSSProperties {
  const preset = SHEET_PRESETS[theme?.preset ?? 'washi'] ?? SHEET_PRESETS.washi
  const style: CSSProperties = {
    ...preset.style,
    ...(theme?.paper ? THEME_PAPERS[theme.paper] : {}),
  }
  // A sheet styling its own background via classes beats the preset's inline one.
  if (classProp && /(?:^|\s)(?:bg-|from-|via-|to-)/.test(classProp)) {
    style.backgroundColor = undefined
    style.backgroundImage = undefined
    style.backgroundSize = undefined
  }
  if (theme?.accent) {
    ;(style as Record<string, string>)['--sheet-accent'] = `var(--tape-${theme.accent})`
  }
  return style
}

function sheetFace(theme: SheetTheme | undefined): string {
  if (theme?.face) return THEME_FACES[theme.face] ?? ''
  return (SHEET_PRESETS[theme?.preset ?? 'washi'] ?? SHEET_PRESETS.washi).faceClass
}

function renderChildren(nodes: WsxNode[]): ReactNode[] {
  return nodes.map((node, index) =>
    node.kind === 'text' ? node.value : <WsxElementView key={index} node={node} />,
  )
}

// biome-ignore format: table-shaped mapping reads better dense
function renderElement(node: WsxElement): ReactNode {
  const p = node.props as Record<string, never>
  const kids = renderChildren(node.children)
  switch (node.name) {
    case 'Sheet': {
      const theme = p.theme as SheetTheme | undefined
      return (
        <article
          className={`mx-auto w-full max-w-2xl rounded-xl px-8 py-6 ${sheetFace(theme)} ${p.class ?? ''}`}
          style={sheetStyle(theme, p.class)}
        >
          {kids}
        </article>
      )
    }
    case 'Box': return <div className={p.class}>{kids}</div>
    case 'Span': return <span className={p.class}>{kids}</span>
    case 'Hero': return <Hero title={p.title} subtitle={p.subtitle} align={p.align} size={p.size} className={p.class} />
    case 'Tape': return <Tape color={p.color} className={p.class}>{kids}</Tape>
    case 'Stamp': return <Stamp label={p.label} tone={p.tone} className={p.class} />
    case 'Chip': return <Chip color={p.color} className={p.class}>{kids}</Chip>
    case 'Stat': return <Stat value={p.value} label={p.label} hint={p.hint} className={p.class} />
    case 'Card': return <Card title={p.title} accent={p.accent} className={p.class}>{kids}</Card>
    case 'Timeline': return <Timeline className={p.class}>{kids}</Timeline>
    case 'Step': return <Step marker={p.marker} title={p.title} color={p.color} className={p.class}>{kids}</Step>
    case 'H1': return <H1 className={p.class}>{kids}</H1>
    case 'H2': return <H2 className={p.class}>{kids}</H2>
    case 'H3': return <H3 className={p.class}>{kids}</H3>
    case 'P': return <P className={p.class}>{kids}</P>
    case 'Quote': return <Quote className={p.class}>{kids}</Quote>
    case 'Callout': return <Callout tone={p.tone} className={p.class}>{kids}</Callout>
    case 'Code': return <Code lang={p.lang} className={p.class}>{kids}</Code>
    case 'Divider': return <Divider />
    case 'Img': return <Img src={p.src} alt={p.alt} className={p.class} />
    case 'Ref': return <Ref sheet={p.sheet} className={p.class}>{kids.length ? kids : undefined}</Ref>
    case 'Tag': return <Tag className={p.class}>{kids}</Tag>
    case 'TaskList': return <TaskList bind={p.bind} className={p.class}>{kids}</TaskList>
    case 'Task': return <Task done={p.done} record={p.record} className={p.class}>{kids}</Task>
    case 'Table': return <Table bind={p.bind} columns={p.columns} className={p.class} />
    case 'Board': return <Board bind={p.bind} groupBy={p.groupBy} className={p.class} />
    case 'Toggle': return <Toggle label={p.label} className={p.class}>{kids}</Toggle>
    case 'Columns': return <Columns className={p.class}>{kids}</Columns>
    case 'Column': return <Column className={p.class}>{kids}</Column>
    case 'Button': return <Button action={p.action} className={p.class}>{kids}</Button>
    case 'Fetch': return <Fetch url={p.url} as={p.as} className={p.class} />
    default: return <Callout tone="danger">unknown component: {node.name}</Callout>
  }
}

function WsxElementView({ node }: { node: WsxElement }) {
  return <>{renderElement(node)}</>
}

/** Render a parsed, validated WSX tree. Validate first — this trusts its input. */
export function WsxView({ root }: { root: WsxElement }) {
  return <WsxElementView node={root} />
}
