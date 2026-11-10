import type { SheetSummary, Viewer } from '@washi/domain'
import type { Workspace } from '@washi/repository'
import { parse } from '@washi/wsx'
import { pagesFor } from '../agents/lib/pages'
import { cutAt, fit } from './budget'
import { exprEvaluator } from './evaluate'
import { agentGuideId, guideText } from './guide'
import { pageMarkdown } from './render'
import { tableDigests } from './tables'
import { renderContextOf, treeOf, walkTree } from './tree'
import type { BudgetPage, ContextRequest } from './types'
import { DEFAULT_MAX_CHARS, MAX_MAX_CHARS, MIN_MAX_CHARS, ROWS_SHARE } from './values'

const counted = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

/** A line of the tree; a page with a section of its own below carries its id there instead. */
const pageLine = (page: SheetSummary, depth: number, withId: boolean) =>
  `${'  '.repeat(depth)}- ${page.title}${withId ? ` \`${page.id}\`` : ''}${page.tags.length ? ` #${page.tags.join(' #')}` : ''}`

/** A page's words as Markdown, or a line saying why there are none. */
function bodyOf(
  ws: Workspace,
  viewer: Viewer,
  tree: ReturnType<typeof treeOf>,
  id: string,
  evaluate: (expr: string) => string | null,
) {
  const page = pagesFor(ws, viewer).get(id)
  if (!page) return '*Gone.*'
  try {
    return (
      pageMarkdown(parse(page.source), { ...renderContextOf(tree, id), evaluate }) || '*Empty.*'
    )
  } catch {
    return `*Its source does not parse — sheet_get { "id": "${id}" } reads it.*`
  }
}

const headOf = (page: SheetSummary, tree: ReturnType<typeof treeOf>, isGuide: boolean) => {
  const parent = page.parentId ? tree.byId.get(page.parentId)?.title : null
  return [
    `## ${page.title}${isGuide ? ' (agent guide — read it first)' : ''}`,
    `\`${page.id}\`${parent ? ` · under ${parent}` : ''}${page.tags.length ? ` · #${page.tags.join(' #')}` : ''}`,
  ].join('\n')
}

/**
 * A workspace in one read (D135): the page tree, each page's words as Markdown, every table's
 * shape and counts, and the rows still open — the agent guide first when there is one — in at most
 * `maxChars`, ending with what was cut and how to read it. Only what the viewer may read.
 */
export function workspaceContext(ws: Workspace, viewer: Viewer, request: ContextRequest = {}) {
  const budget = Math.min(
    MAX_MAX_CHARS,
    Math.max(MIN_MAX_CHARS, request.maxChars ?? DEFAULT_MAX_CHARS),
  )
  const pages = pagesFor(ws, viewer)
  const tree = treeOf(pages.list())
  if (request.root) {
    pages.require(request.root)
    if (!tree.byId.has(request.root)) throw new Error(`no page ${request.root} in the tree`)
  }
  const walked = walkTree(request.root ? [request.root] : tree.tops, tree.children, request.depth)
  const guideId = agentGuideId(ws)
  const guide = guideId ? tree.byId.get(guideId) : undefined
  const order = guide
    ? [{ id: guide.id, depth: 0 }, ...walked.filter((each) => each.id !== guide.id)]
    : walked

  const shown = new Set(order.map(({ id }) => id))
  const treeLines = walkTree(tree.tops, tree.children).map(({ id, depth }) =>
    pageLine(tree.byId.get(id) as SheetSummary, depth, !shown.has(id)),
  )
  const treeText = cutAt(treeLines.join('\n'), Math.floor(budget * 0.2))
  const treeCut = treeText.length < treeLines.join('\n').length
  const tables = tableDigests(ws, viewer, request.tables)
  const header = [
    `# ${request.workspaceName ? `${request.workspaceName} — ` : ''}workspace context`,
    `${counted(tree.byId.size, 'page')}, ${counted(tables.length, 'table')}. Page ids work with sheet_get, sheet_edit and sheet_replace; row ids with db_mutate and comment_add.`,
  ].join('\n')
  const fixed = [
    header,
    `## Pages\n${treeText}${treeCut ? '\n… more pages — sheet_list' : ''}`,
    `## Tables\n${tables.map((each) => each.digest.summary).join('\n\n') || 'None.'}`,
  ]
  const heads = order.map(({ id }) =>
    headOf(tree.byId.get(id) as SheetSummary, tree, id === guideId),
  )
  const evaluate = exprEvaluator(ws)
  const bodies: BudgetPage[] = order.map(({ id }) => ({
    id,
    title: tree.byId.get(id)?.title ?? id,
    body: bodyOf(ws, viewer, tree, id, evaluate),
  }))
  // The guide is read first and kept whole up to its own cap; the other pages share the rest.
  const guideBody = guide ? guideText(bodies[0]?.body ?? '', guide.id) : null
  const budgetPages = guide ? bodies.slice(1) : bodies
  const reserve =
    fixed.join('\n\n').length +
    heads.join('\n\n').length +
    (guideBody?.length ?? 0) +
    order.length * 4 +
    400
  const rows = tables.flatMap(({ name, digest }) =>
    digest.rows ? [{ name, text: digest.rows, fetch: digest.rowsFetch }] : [],
  )
  const unread = walked.length < tree.byId.size && !request.root
  const assemble = (room: number) => {
    const fitted = fit(budgetPages, rows, Math.max(0, room), Math.floor(budget * ROWS_SHARE))
    const bodiesNow = [
      ...(guideBody === null ? [] : [guideBody]),
      ...fitted.pages.map((page) => page.body),
    ]
    const pageText = bodiesNow.map((body, index) => `${heads[index]}\n\n${body}`)
    const rowsOf = new Map(fitted.rows.map((each) => [each.name, each.text]))
    const tableText = tables.map(({ name, digest }) =>
      [digest.summary, rowsOf.get(name)].filter(Boolean).join('\n\n'),
    )
    const leftOut = [
      ...(treeCut ? ['part of the page tree — sheet_list'] : []),
      ...(unread ? [`pages deeper than depth ${request.depth} — context_get with a root`] : []),
      ...fitted.leftOut,
    ]
    return [
      header,
      ...(guide ? [pageText[0]] : []),
      fixed[1],
      ...pageText.slice(guide ? 1 : 0),
      `## Tables\n${tableText.join('\n\n') || 'None.'}`,
      leftOut.length
        ? `## Left out\nCut to ${budget} characters (maxChars). Read the rest with:\n${leftOut.map((each) => `- ${each}`).join('\n')}`
        : '*Nothing left out.*',
    ].join('\n\n')
  }
  // The reserve is a guess at what never shrinks; a digest still over is fitted again, tighter.
  let room = budget - reserve
  let out = assemble(room)
  for (let tries = 0; out.length > budget && tries < 4; tries++) {
    room -= out.length - budget + 50
    out = assemble(room)
  }
  return out
}
