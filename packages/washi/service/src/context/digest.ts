import type { SheetSummary, Viewer } from '@washi/domain'
import { getSheet, type Workspace } from '@washi/repository'
import { parse } from '@washi/wsx'
import { pagesFor } from '../agents/lib/pages'
import { SheetNotFoundError } from '../sheets/access'
import { cutAt, cutLines, fitPages, fitRows } from './budget'
import { exprEvaluator } from './evaluate'
import { agentGuideId, guideText } from './guide'
import { pageMarkdown } from './render'
import { tableDigests } from './tables'
import { renderContextOf, treeOf, walkTree } from './tree'
import type { BudgetRows, ContextRequest, PageCandidate } from './types'
import { DEFAULT_MAX_CHARS, HARD_CUT, MAX_MAX_CHARS, MIN_MAX_CHARS, SHARES } from './values'

type Tree = ReturnType<typeof treeOf>

const counted = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

/** A line of the tree; a page with a section of its own below carries its id there instead. */
const pageLine = (page: SheetSummary, depth: number, withId: boolean) =>
  `${'  '.repeat(depth)}- ${page.title}${withId ? ` \`${page.id}\`` : ''}${page.tags.length ? ` #${page.tags.join(' #')}` : ''}`

const headOf = (page: SheetSummary, tree: Tree, isGuide: boolean) => {
  const parent = page.parentId ? tree.byId.get(page.parentId)?.title : null
  return [
    `## ${page.title}${isGuide ? ' (agent guide — read it first)' : ''}`,
    `\`${page.id}\`${parent ? ` · under ${parent}` : ''}${page.tags.length ? ` · #${page.tags.join(' #')}` : ''}`,
  ].join('\n')
}

/** A page's words as Markdown, read when asked: the tree already holds only what the reader reads. */
function bodyOf(ws: Workspace, tree: Tree, id: string, evaluate: (expr: string) => string | null) {
  const page = getSheet(ws, id)
  if (!page) return '*Gone.*'
  try {
    return (
      pageMarkdown(parse(page.source), { ...renderContextOf(tree, id), evaluate }) || '*Empty.*'
    )
  } catch {
    return `*Its source does not parse — sheet_get { "id": "${id}" } reads it.*`
  }
}

/** The tables' summaries that fit their share, and the rows of those tables. */
function tablesPart(ws: Workspace, viewer: Viewer, request: ContextRequest, budget: number) {
  const tables = tableDigests(ws, viewer, request.tables)
  const summaries: string[] = []
  const rows: BudgetRows[] = []
  let used = 0
  const more = (count: number) => `… ${counted(count, 'more table')} — db_list_tables`
  for (const [index, table] of tables.entries()) {
    const summary = table.summary()
    const room = index < tables.length - 1 ? more(tables.length - index - 1).length : 0
    if (used + summary.length + 2 + room > budget * SHARES.tables) {
      summaries.push(more(tables.length - index))
      break
    }
    summaries.push(summary)
    used += summary.length + 2
    const read = table.rows()
    if (read.text) {
      rows.push({
        name: table.name,
        text: read.text,
        fetch: read.fetch,
        unshown: read.unshown ?? 0,
      })
    }
  }
  return {
    count: tables.length,
    summaries,
    rows,
    folded: summaries.length > 0 && summaries.at(-1)?.startsWith('… '),
  }
}

/**
 * A workspace in one read (D135): the agent guide first, the page tree, each page's words as
 * Markdown, every table's shape and counts, and the rows still open — in at most `maxChars`, every
 * heading, stub and note included, ending with what was cut and how to read it. Each part has a
 * share; the pages take what the rest leave, and past what fits the rest of the tree is counted,
 * never read. Only what the viewer may read.
 */
export function workspaceContext(ws: Workspace, viewer: Viewer, request: ContextRequest = {}) {
  const budget = Math.min(
    MAX_MAX_CHARS,
    Math.max(MIN_MAX_CHARS, request.maxChars ?? DEFAULT_MAX_CHARS),
  )
  const tree = treeOf(pagesFor(ws, viewer).list())
  if (request.root && !tree.byId.has(request.root)) throw new SheetNotFoundError(request.root)
  const walked = walkTree(request.root ? [request.root] : tree.tops, tree.children, request.depth)
  const guideId = agentGuideId(ws)
  const guide = guideId ? tree.byId.get(guideId) : undefined
  const evaluate = exprEvaluator(ws)
  const page = (id: string) => tree.byId.get(id) as SheetSummary

  const tables = tablesPart(ws, viewer, request, budget)
  const header = [
    `# ${request.workspaceName ? `${request.workspaceName} — ` : ''}workspace context`,
    `${counted(tree.byId.size, 'page')}, ${counted(tables.count, 'table')}. Page ids work with sheet_get, sheet_edit and sheet_replace; row ids with db_mutate and comment_add.`,
  ].join('\n')
  const guideText_ = guide
    ? `${headOf(guide, tree, true)}\n\n${guideText(bodyOf(ws, tree, guide.id, evaluate), guide.id, Math.floor(budget * SHARES.guide))}`
    : null
  const shown = new Set(walked.map(({ id }) => id))
  const treeLines = walkTree(tree.tops, tree.children).map(({ id, depth }) =>
    pageLine(page(id), depth, !shown.has(id)),
  )
  const treeText = `## Pages\n${cutLines(treeLines, budget * SHARES.tree, (count) => `… ${counted(count, 'more page')} — sheet_list`)}`
  const rows = fitRows(tables.rows, budget * SHARES.rows)
  const tableText = `## Tables\n${tables.summaries.map((summary) => [summary, rows.texts.get(summary.match(/^### `([^`]+)`/)?.[1] ?? '')].filter(Boolean).join('\n\n')).join('\n\n') || 'None.'}`

  const candidates: PageCandidate[] = walked
    .filter(({ id }) => id !== guide?.id)
    .map(({ id }) => ({
      id,
      title: page(id).title,
      head: headOf(page(id), tree, false),
      body: () => bodyOf(ws, tree, id, evaluate),
    }))
  const leftRoom = Math.max(300, Math.floor(budget * SHARES.leftOut))
  const fixed = [header, guideText_, treeText, tableText].filter(
    (part): part is string => part !== null,
  )
  const room = budget - fixed.join('\n\n').length - leftRoom - 8
  const pages = fitPages(candidates, Math.max(0, room))

  const leftOut = [
    ...(treeLines.join('\n').length > budget * SHARES.tree
      ? ['part of the page tree — sheet_list']
      : []),
    ...(pages.dropped
      ? [
          `${counted(pages.dropped, 'page')} not read here — sheet_list names them; context_get { "root": "<id>" } reads one part`,
        ]
      : []),
    ...(pages.cut.length
      ? [
          `pages cut short (their id is under their heading — sheet_get): ${pages.cut.map((title) => `"${title}"`).join(', ')}`,
        ]
      : []),
    ...(walked.length < tree.byId.size && !request.root && request.depth !== undefined
      ? [`pages deeper than depth ${request.depth} — context_get with a root`]
      : []),
    ...(tables.folded
      ? ['tables past their share — db_list_tables, or context_get { "tables": [...] }']
      : []),
    ...rows.cut,
  ]
  const leftText = leftOut.length
    ? cutAt(
        `## Left out\nCut to ${budget} characters (maxChars). Read the rest with:\n${leftOut.map((each) => `- ${each}`).join('\n')}`,
        leftRoom,
      )
    : '*Nothing left out.*'
  const out = [header, guideText_, treeText, ...pages.sections, tableText, leftText]
    .filter((part): part is string => part !== null)
    .join('\n\n')
  // Every part kept to its share should land under the cap; this is the line that guarantees it.
  return out.length <= budget ? out : `${cutAt(out, budget - HARD_CUT.length)}${HARD_CUT}`
}
