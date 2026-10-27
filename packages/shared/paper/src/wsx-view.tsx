import type { WsxElement, WsxNode } from '@washi/wsx'
import { type ComponentType, createElement, type ReactNode, useMemo } from 'react'
import { Agenda } from './components/agenda'
import { Board } from './components/board'
import { Canvas } from './components/canvas'
import {
  Avatar,
  Badge,
  Chart,
  Progress,
  Repeat,
  Stat,
  Step,
  Table,
  Timeline,
} from './components/data'
import { Database } from './components/database'
import { Drawer, Schema } from './components/drawer'
import { Reveal, Show, Tab, Tabs } from './components/flow'
import { Form } from './components/form'
import { Divider, Grid, Row, Section, SheetFrame, Stack } from './components/frame'
import { Button, Compose, Field, Slider, Switch, Task } from './components/input'
import { Chip, Mascot, Missing } from './components/kit'
import { Redact } from './components/redact'
import { Roadmap } from './components/roadmap'
import { Select } from './components/select'
import { Callout, Card, Figure, Hero } from './components/surface'
import {
  Code,
  Item,
  Kbd,
  List,
  Mark,
  Money,
  Note,
  Pair,
  Quote,
  Ref,
  Source,
  Tag,
  Text,
  Title,
} from './components/text'
import { DataProvider } from './data'
import { NowContext, resolveRow, resolveRowDeep } from './lib'
import type { Row as DataRow } from './lib/types'
import { exprTables } from './registry/share'
import { SheetStateProvider, type SheetStateValue } from './state'

interface Ctx {
  numbers: Map<WsxElement, number>
  row?: DataRow
}

function resolveProps(node: WsxElement, row: DataRow | undefined): Record<string, never> {
  if (!row) return node.props as Record<string, never>
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node.props)) {
    out[key] = key === 'expr' ? value : resolveRowDeep(value, row)
  }
  return out as Record<string, never>
}

function numberFootnotes(root: WsxElement): Map<WsxElement, number> {
  const numbers = new Map<WsxElement, number>()
  const counters = { Note: 0, Source: 0 }
  const descend = (node: WsxNode) => {
    if (node.kind !== 'element') return
    if (node.name === 'Note' || node.name === 'Source') numbers.set(node, ++counters[node.name])
    for (const child of node.children) descend(child)
  }
  descend(root)
  return numbers
}

function renderChildren(nodes: WsxNode[], ctx: Ctx): ReactNode[] {
  return nodes.map((node, index) =>
    node.kind === 'text' ? (
      resolveRow(node.value, ctx.row)
    ) : (
      <Element key={index} node={node} ctx={ctx} />
    ),
  )
}

const COMPONENTS: Record<string, ComponentType<never>> = {
  Section,
  Row,
  Stack,
  Grid,
  Divider,
  Title,
  Text,
  List,
  Item,
  Quote,
  Code,
  Pair,
  Money,
  Mark,
  Kbd,
  Ref,
  Tag,
  Card,
  Callout,
  Redact,
  Hero,
  Figure,
  Table,
  Stat,
  Chart,
  Timeline,
  Step,
  Progress,
  Badge,
  Avatar,
  Field,
  Agenda,
  Board,
  Database,
  Roadmap,
  Button,
  Task,
  Switch,
  Select,
  Slider,
  Show,
  Tabs,
  Tab,
  Reveal,
  Chip,
  Mascot,
  Missing,
  Compose,
  Form,
  Schema,
}

function renderElement(node: WsxElement, ctx: Ctx): ReactNode {
  const p = resolveProps(node, ctx.row)
  const kids = renderChildren(node.children, ctx)
  switch (node.name) {
    case 'Sheet':
      return (
        <SheetFrame theme={p.theme} feel={p.feel} accent={p.accent} icon={p.icon} cover={p.cover}>
          {kids}
        </SheetFrame>
      )
    case 'Drawer':
      return createElement(Drawer, {
        ...p,
        children: (row: DataRow | null) =>
          renderChildren(node.children, row ? { ...ctx, row } : ctx),
      } as never)
    case 'Repeat':
      return createElement(Repeat, {
        ...p,
        children: (row: DataRow) => renderChildren(node.children, { ...ctx, row }),
      } as never)
    case 'Note':
      return createElement(Note, { ...p, number: ctx.numbers.get(node) ?? 0 } as never, ...kids)
    case 'Source':
      return createElement(Source, { ...p, number: ctx.numbers.get(node) ?? 0 } as never, ...kids)
    case 'Ref':
      return createElement(Ref, p as never, ...(kids.length ? kids : []))
    case 'Canvas':
      // The canvas reads its Node/Edge markup itself: it has to write the same markup back.
      return <Canvas node={node} />
    default: {
      const component = COMPONENTS[node.name]
      if (!component) return <Missing kind={node.name} reason="not a registry primitive" />
      return createElement(component, p as never, ...kids)
    }
  }
}

function Element({ node, ctx }: { node: WsxElement; ctx: Ctx }) {
  return <>{renderElement(node, ctx)}</>
}

function initialState(root: WsxElement): Record<string, SheetStateValue> {
  const state = root.props.state as
    | { local?: Record<string, SheetStateValue>; stored?: Record<string, SheetStateValue> }
    | undefined
  return { ...(state?.stored ?? {}), ...(state?.local ?? {}) }
}

/** Render a parsed, validated WSX tree. Validate first — this trusts its input. */
export function WsxView({ root }: { root: WsxElement }) {
  const tables = useMemo(() => exprTables(root), [root])
  const numbers = useMemo(() => numberFootnotes(root), [root])
  const now = useMemo(() => Date.now(), [root])

  return (
    <SheetStateProvider initial={initialState(root)}>
      <DataProvider tables={tables}>
        <NowContext.Provider value={now}>
          <Element node={root} ctx={{ numbers }} />
        </NowContext.Provider>
      </DataProvider>
    </SheetStateProvider>
  )
}
