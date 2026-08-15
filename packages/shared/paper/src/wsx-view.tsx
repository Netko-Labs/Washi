import type { WsxElement, WsxNode } from '@washi/wsx'
import type { CSSProperties, ReactNode } from 'react'
import {
  Accordion,
  AccordionItem,
  Avatar,
  Badge,
  Dialog,
  Kbd,
  Progress,
  Show,
  Skeleton,
  Slider,
  Switch,
  Tab,
  Tabs,
  Tooltip,
} from './components/controls'
import { Board, Table, Task, TaskList } from './components/data'
import { Card, Chip, Hero, Stamp, Stat, Step, Tape, Timeline } from './components/display'
import { Button, Column, Columns, Fetch, Img, Ref, Toggle } from './components/interactive'
import { SHEET_PRESETS, type SheetPreset } from './components/themes'
import { Callout, Code, Divider, H1, H2, H3, P, Quote, Tag } from './components/typography'
import { cn } from './lib'
import { SheetStateProvider, type SheetStateValue } from './state'

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

/**
 * Presets are opt-in seeds, never a default (spec Q15/Q18). A sheet that asks
 * for none gets none — no background, no face, no padding, no width — so its
 * own classes are the only appearance it has.
 */
function sheetStyle(theme: SheetTheme | undefined): CSSProperties {
  if (!theme) return {}
  const preset = theme.preset ? SHEET_PRESETS[theme.preset] : undefined
  const style: CSSProperties = {
    ...(preset?.style ?? {}),
    ...(theme.paper ? THEME_PAPERS[theme.paper] : {}),
  }
  if (theme.accent) {
    ;(style as Record<string, string>)['--sheet-accent'] = `var(--tape-${theme.accent})`
  }
  return style
}

function sheetFace(theme: SheetTheme | undefined): string {
  if (theme?.face) return THEME_FACES[theme.face] ?? ''
  return theme?.preset ? (SHEET_PRESETS[theme.preset]?.faceClass ?? '') : ''
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
      // `@container` makes the sheet the query root, so @sm:/@md: track the
      // sheet's own width — a tab, a 400px popover, a phone (spec Q16).
      return (
        <article className={cn('@container', sheetFace(theme), p.class)} style={sheetStyle(theme)}>
          {kids}
        </article>
      )
    }
    case 'Box': return <div className={p.class}>{kids}</div>
    case 'Span': return <span className={p.class}>{kids}</span>
    case 'Show': return <Show when={p.when} equals={p.equals} not={p.not}>{kids}</Show>
    case 'Switch': return <Switch state={p.state} label={p.label} className={p.class} />
    case 'Slider': return <Slider state={p.state} min={p.min} max={p.max} step={p.step} label={p.label} className={p.class} />
    case 'Tabs': return <Tabs labels={p.labels} state={p.state} className={p.class}>{kids}</Tabs>
    case 'Tab': return <Tab className={p.class}>{kids}</Tab>
    case 'Accordion': return <Accordion className={p.class}>{kids}</Accordion>
    case 'AccordionItem': return <AccordionItem title={p.title} className={p.class}>{kids}</AccordionItem>
    case 'Dialog': return <Dialog trigger={p.trigger} title={p.title} className={p.class}>{kids}</Dialog>
    case 'Tooltip': return <Tooltip label={p.label} className={p.class}>{kids}</Tooltip>
    case 'Badge': return <Badge tone={p.tone} className={p.class}>{kids}</Badge>
    case 'Avatar': return <Avatar label={p.label} className={p.class} />
    case 'Progress': return <Progress value={p.value} max={p.max} className={p.class} />
    case 'Skeleton': return <Skeleton className={p.class} />
    case 'Kbd': return <Kbd className={p.class}>{kids}</Kbd>
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
    case 'Divider': return <Divider className={p.class} />
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
  const initial = (root.props.state as Record<string, SheetStateValue> | undefined) ?? {}
  return (
    <SheetStateProvider initial={initial}>
      <WsxElementView node={root} />
    </SheetStateProvider>
  )
}
