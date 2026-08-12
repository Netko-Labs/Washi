import type { WsxElement, WsxNode } from '@washi/wsx'
import type { ReactNode } from 'react'
import { Board, Table, Task, TaskList } from './components/data'
import { Button, Column, Columns, Fetch, Img, Ref, Toggle } from './components/interactive'
import { Callout, Code, Divider, H1, H2, H3, P, Quote, Tag } from './components/typography'

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
    case 'Sheet': return <article className={`mx-auto w-full max-w-2xl px-8 py-6 ${p.class ?? ''}`}>{kids}</article>
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
