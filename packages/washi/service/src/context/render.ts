import type { WsxElement, WsxNode } from '@washi/wsx'
import { dataLine, tableOf } from './data'
import type { RenderContext, RenderState } from './types'
import { cell, inlineOf, isInlineRun, oneLine, word } from './utils'
import { DATA_BOUND, LAYOUT, SILENT, WRITTEN_CELL_CHARS } from './values'

const heading = (state: RenderState, extra = 0) => '#'.repeat(Math.min(6, 3 + state.level + extra))

/** Bullets one after another read as one list, not as paragraphs apart. */
function joinBullets(blocks: string[]): string[] {
  const out: string[] = []
  for (const each of blocks) {
    const last = out.length - 1
    if (last >= 0 && each.startsWith('- ') && out[last]?.startsWith('- ')) {
      out[last] = `${out[last]}\n${each}`
    } else out.push(each)
  }
  return out
}

/** Children read as blocks, or as one paragraph when they are only words. */
function blocksOf(children: WsxNode[], state: RenderState): string[] {
  if (children.length === 0) return []
  if (isInlineRun(children)) {
    const words = inlineOf(children, state.ctx)
    return words ? [words] : []
  }
  return joinBullets(
    children.flatMap((child) =>
      child.kind === 'element'
        ? block(child, state)
        : child.kind === 'text' && child.value.trim()
          ? [oneLine(child.value)]
          : [],
    ),
  )
}

/** Blocks as one run of text: what an Item, a Step or a Callout holds. */
const flat = (children: WsxNode[], state: RenderState) => blocksOf(children, state).join(' ')

/** `- ` before the first line, the rest indented under it. */
const bullet = (lead: string, text: string) =>
  `${lead}${text.split('\n').join(`\n${' '.repeat(lead.length)}`)}`

function list(el: WsxElement, state: RenderState): string[] {
  const ordered = word(el.props.marker) === 'number'
  const lines = el.children.flatMap((child, index) => {
    if (child.kind !== 'element')
      return child.kind === 'text' && child.value.trim() ? [`- ${oneLine(child.value)}`] : []
    const lead = ordered ? `${index + 1}. ` : '- '
    if (child.name === 'Item' || child.name === 'Task') {
      const box = child.props.done === true ? '[x] ' : child.props.done === false ? '[ ] ' : ''
      return [bullet(`${lead}${box}`, flat(child.children, state))]
    }
    return block(child, state).map((text) => bullet(lead, text))
  })
  return lines.length ? [lines.join('\n')] : []
}

/** A written `<Table columns rows>` as a pipe table. */
function writtenTable(el: WsxElement): string[] {
  const columns = Array.isArray(el.props.columns) ? el.props.columns.map((each) => cell(each)) : []
  const rows = Array.isArray(el.props.rows) ? el.props.rows : []
  if (columns.length === 0) return []
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`
  const body = rows.map((row) =>
    line(
      columns.map((_, index) => (Array.isArray(row) ? cell(row[index], WRITTEN_CELL_CHARS) : '')),
    ),
  )
  return [[line(columns), line(columns.map(() => '---')), ...body].join('\n')]
}

/** Steps, Timeline, Faq and Compare: a titled entry per child. */
function titled(el: WsxElement, state: RenderState, index: number): string {
  const title = word(el.props.title)
  const marker = word(el.props.marker)
  const text = flat(el.children, state)
  const pick = el.props.pick === true ? ' (the pick)' : ''
  const head = [marker, title ? `**${title}**${pick}` : null].filter(Boolean).join(' ')
  const lead = el.name === 'Step' && !marker ? `${index + 1}. ` : '- '
  return bullet(lead, [head, text].filter(Boolean).join(' — '))
}

function stat(el: WsxElement, ctx: RenderContext): string[] {
  if (tableOf(el)) return [dataLine(el)]
  const label = word(el.props.label) ?? 'Stat'
  const expr = word(el.props.expr)
  const value = word(el.props.value) ?? (expr ? (ctx.evaluate?.(expr) ?? `= ${expr}`) : '—')
  const hint = word(el.props.hint)
  return [`- ${label}: ${value}${hint ? ` (${hint})` : ''}`]
}

function subpages(el: WsxElement, ctx: RenderContext): string[] {
  const of = word(el.props.of) ?? ctx.pageId
  const names = (ctx.children.get(of) ?? []).map((id) => ctx.titles.get(id) ?? id)
  return [names.length ? `*Sub-pages: ${names.join(' · ')}*` : '*Sub-pages: none yet*']
}

function media(el: WsxElement): string[] {
  const src = word(el.props.src) ?? word(el.props.href)
  const name =
    word(el.props.caption) ??
    word(el.props.alt) ??
    word(el.props.title) ??
    word(el.props.name) ??
    word(el.props.description)
  return [`*${el.name}${name ? `: ${name}` : ''}${src ? ` (${src})` : ''}*`]
}

/** One element as Markdown blocks. */
function block(el: WsxElement, state: RenderState): string[] {
  const { ctx } = state
  if (SILENT.has(el.name)) return el.name === 'Divider' ? ['---'] : []
  if (el.name === 'Table' && !el.props.bind) return writtenTable(el)
  if (el.name === 'Stat' || el.name === 'Progress') return stat(el, ctx)
  if (DATA_BOUND.has(el.name) || (el.name === 'Table' && el.props.bind)) return [dataLine(el)]
  if (LAYOUT.has(el.name)) {
    if (['Steps', 'Timeline', 'Faq', 'Compare'].includes(el.name)) {
      const entries = el.children.filter((child): child is WsxElement => child.kind === 'element')
      return [entries.map((child, index) => titled(child, state, index)).join('\n')]
    }
    return blocksOf(el.children, state)
  }
  switch (el.name) {
    case 'Section':
    case 'Card':
    case 'Tile':
    case 'Reveal': {
      const title = word(el.props.title) ?? word(el.props.label)
      const inner = blocksOf(el.children, { ...state, level: state.level + (title ? 1 : 0) })
      if (!title) return inner
      if (el.name === 'Section') return [`${heading(state)} ${title}`, ...inner]
      // A titled tile holding one short line reads as one bullet: "Open — backlog items: 34".
      const [only] = inner
      if (inner.length === 1 && only && !only.includes('\n') && only.length < 200) {
        return [`- **${title}** — ${only.replace(/^- /, '')}`]
      }
      return [`**${title}**`, ...inner]
    }
    case 'Title': {
      const level = typeof el.props.level === 'number' ? el.props.level - 1 : 0
      return [`${heading(state, level)} ${inlineOf(el.children, ctx)}`]
    }
    case 'Text':
      return blocksOf(el.children, state)
    case 'List':
      return list(el, state)
    case 'Item':
    case 'Task':
      return [`- ${flat(el.children, state)}`]
    case 'Quote':
      return [`> ${flat(el.children, state)}`]
    case 'Callout': {
      const title = word(el.props.title)
      const tone = word(el.props.tone)
      return [
        `> ${title ? `**${title}${tone ? ` (${tone})` : ''}:** ` : ''}${flat(el.children, state)}`,
      ]
    }
    case 'Code': {
      const text = el.children.map((child) => (child.kind === 'text' ? child.value : '')).join('')
      return [`\`\`\`${word(el.props.lang) ?? ''}\n${text.replace(/^\n|\n\s*$/g, '')}\n\`\`\``]
    }
    case 'Pair':
      return [`- **${word(el.props.term) ?? ''}:** ${flat(el.children, state)}`]
    case 'Hero':
      return [[word(el.props.title), word(el.props.subtitle)].filter(Boolean).join(' — ')]
    case 'Tabs': {
      const labels = Array.isArray(el.props.labels) ? el.props.labels : []
      const tabs = el.children.filter((child): child is WsxElement => child.kind === 'element')
      return tabs.flatMap((tab, index) => [
        `${heading(state)} Tab: ${word(labels[index]) ?? `Tab ${index + 1}`}`,
        ...blocksOf(tab.children, { ...state, level: state.level + 1 }),
      ])
    }
    case 'Subpages':
      return subpages(el, ctx)
    case 'PageLink':
    case 'Include': {
      const id = word(el.props.sheet)
      const title = id ? (ctx.titles.get(id) ?? 'a page you cannot open') : 'a page'
      return [`*${el.name === 'Include' ? 'Includes' : 'Links to'} [${title}](sheet:${id ?? ''})*`]
    }
    case 'Backlinks':
      return ['*Pages linking here*']
    case 'Countdown':
      return [`- ${word(el.props.label) ?? 'Countdown'}: ${word(el.props.to) ?? ''}`]
    case 'Figure':
    case 'Video':
    case 'Audio':
    case 'File':
    case 'Embed':
    case 'Bookmark':
      return media(el)
    case 'Canvas': {
      const nodes = el.children.filter(
        (child): child is WsxElement => child.kind === 'element' && child.name === 'Node',
      )
      return [`*Canvas:* ${nodes.map((node) => inlineOf(node.children, ctx)).join(' · ')}`]
    }
    case 'Button':
      return [`*Button: ${inlineOf(el.children, ctx)}*`]
    case 'Automation':
      return [
        `*Automation on ${word(el.props.on) ?? 'insert'} in \`${word(el.props.table) ?? '?'}\`${word(el.props.title) ? `: ${word(el.props.title)}` : ''}*`,
      ]
    case 'Formula':
      return [`*Formula function \`${word(el.props.name) ?? '?'}\`*`]
    case 'Widget':
    case 'Terminal':
      return [`*${el.name}${word(el.props.title) ? `: ${word(el.props.title)}` : ''} (runs code)*`]
    case 'Missing':
      return [`*Missing ${word(el.props.kind) ?? ''}: ${word(el.props.reason) ?? ''}*`]
    default:
      return blocksOf(el.children, state)
  }
}

/**
 * A page as Markdown a reader can take in at a glance: headings, paragraphs, lists, written tables,
 * callouts and step titles kept; every block that draws a table's rows is one line naming it.
 * The `<Sheet>` title is the caller's to write.
 */
export function pageMarkdown(root: WsxElement, ctx: RenderContext): string {
  const parts = blocksOf(root.children, { ctx, level: 0 })
  const code = root.prelude
    ? [`*This page runs code (${root.prelude.source.split('\n').length} lines).*`]
    : []
  return [...code, ...parts].filter((part) => part.trim()).join('\n\n')
}
