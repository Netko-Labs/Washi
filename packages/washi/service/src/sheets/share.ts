import { ANY_HOST, type SheetDetail } from '@washi/domain'
import type { HistoryQuery, InkQuery, QueryResult, TableSpec } from '@washi/ink'
import {
  pageTables,
  redactedColumns,
  redactForShare,
  redactionSummary,
} from '@washi/paper/registry'
import {
  getSheet,
  getTableByName,
  getUnsplashPhoto,
  liveShareFor,
  shareByToken,
  type Workspace,
  workspaceThemeBySlug,
} from '@washi/repository'
import { extractFiles, parse, parseExpr, serialize, type WsxElement } from '@washi/wsx'
import { playableEmbedHosts } from '../embeds/service'
import { runHistory } from '../tables/history'
import { runQuery } from '../tables/service'
import { readableSet } from './access'
import { sharedTree, sharesSubpages } from './share-tree'
import type { SharedTreePage } from './types'

/** A link that is revoked, never was, or points at a page no longer public: all look the same. */
export class ShareGoneError extends Error {
  constructor() {
    super('this link does not open anything')
    this.name = 'ShareGoneError'
  }
}

/** A question a link may not ask: another table, or one that reads a redacted column. */
export class ShareRefusedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ShareRefusedError'
  }
}

const WORLD = { id: null, isOwner: false }

interface Shared {
  /** The page being drawn: the link's own, or one of its sub-pages (D123). */
  sheet: SheetDetail
  root: WsxElement
  home: SheetDetail
  /** The sub-pages the link opens, in tree order; empty unless its page shares them. */
  tree: SharedTreePage[]
}

/**
 * The page behind a live token, only while it is public and no ancestor is private — or, with
 * `page`, one of its sub-pages, only while it shares them and nothing private stands between.
 * A sub-page the link does not open reads exactly like a gone link.
 */
export function sharedSheet(ws: Workspace, token: string, page?: string): Shared {
  const share = shareByToken(ws, token)
  const home = share ? getSheet(ws, share.sheetId) : null
  const world = readableSet(ws, WORLD)
  if (home?.visibility !== 'public' || !world.has(home.id)) throw new ShareGoneError()
  const homeRoot = parse(home.source)
  const tree = sharedTree(ws, home, homeRoot, world)
  if (!page || page === home.id) return { sheet: home, root: homeRoot, home, tree }
  const sheet = tree.some((entry) => entry.id === page) ? getSheet(ws, page) : null
  if (!sheet) throw new ShareGoneError()
  return { sheet, root: parse(sheet.source), home, tree }
}

/**
 * What the link shows: the page with every `<Redact>` emptied server-side, and without the
 * list of who may read it. The bytes that leave are already safe; the client hides nothing.
 */
export function sharedPage(ws: Workspace, token: string, page?: string) {
  const { sheet, root, home, tree } = sharedSheet(ws, token, page)
  const {
    access: _access,
    visibility: _visibility,
    suggest,
    subpages: _subpages,
    ...props
  } = root.props
  const isHome = sheet.id === home.id
  return {
    id: sheet.id,
    title: sheet.title,
    icon: sheet.icon,
    cover: sheet.cover,
    fullWidth: sheet.fullWidth,
    hlcUpdated: sheet.hlcUpdated,
    source: serialize(redactForShare({ ...root, props })),
    theme: wornTheme(ws, props.theme),
    unsplash: wornPhoto(ws, sheet.cover),
    // Only whether `*` is listed: a link plays any https embed then, and the list never leaves (D118).
    embedsAnySite: playableEmbedHosts(ws).includes(ANY_HOST),
    // Only the link's own page takes suggestions; a sub-page it opens is read-only (D123).
    suggest: isHome && suggest === true,
    home: { id: home.id, title: home.title, icon: home.icon },
    pages: tree,
  }
}

/** An Unsplash cover's hotlink and credit travel with the link too (D117). */
function wornPhoto(ws: Workspace, cover: string | null) {
  if (!cover?.startsWith('unsplash:')) return null
  const photo = getUnsplashPhoto(ws, cover.slice('unsplash:'.length))
  return (
    photo && {
      id: photo.id,
      url: photo.regularUrl,
      name: photo.photographer,
      profileUrl: photo.profileUrl,
      pageUrl: photo.pageUrl,
    }
  )
}

/** A workspace theme travels with the link; the reader has no session to fetch it with. */
function wornTheme(ws: Workspace, key: unknown) {
  if (typeof key !== 'string' || !key.startsWith('ws:')) return null
  const theme = workspaceThemeBySlug(ws, key.slice(3))
  return theme && { name: theme.name, light: theme.light, dark: theme.dark }
}

function namesIn(node: unknown, into: Set<string>): Set<string> {
  if (!node || typeof node !== 'object') return into
  const { kind, name } = node as { kind?: unknown; name?: unknown }
  if (kind === 'identifier' && typeof name === 'string') into.add(name)
  for (const child of Object.values(node)) namesIn(child, into)
  return into
}

/**
 * The page's redacted columns of `table`; every rollup over a table the page doesn't read, or over
 * a column it redacts there; and every formula that reads any of those — directly or through
 * another formula — or `cop = usd * fx_rate` would hand a hidden `usd` straight to the link.
 */
export function hiddenIn(ws: Workspace, root: WsxElement, table: string): Set<string> {
  const readable = pageTables(root)
  if (!readable.has(table)) {
    throw new ShareRefusedError(`this page does not read "${table}"`)
  }
  const redacted = redactedColumns(root)
  const hidden = new Set(redacted.get(table) ?? [])
  const columns = getTableByName(ws, table)?.spec.columns ?? []
  for (const column of columns) {
    const rollup = column.rollup
    if (column.type !== 'rollup' || !rollup) continue
    const there = redacted.get(rollup.table) ?? new Set<string>()
    const touched = [rollup.via, rollup.column, ...(rollup.where ?? []).map((each) => each.column)]
    if (!readable.has(rollup.table) || touched.some((name) => name && there.has(name))) {
      hidden.add(column.name)
    }
  }
  if (hidden.size === 0) return hidden
  for (const column of columns.filter((each) => each.type === 'formula' && each.expr)) {
    let reads: Set<string>
    try {
      reads = namesIn(parseExpr(column.expr ?? ''), new Set())
    } catch {
      reads = new Set()
    }
    if ([...reads].some((name) => hidden.has(name))) hidden.add(column.name)
  }
  return hidden
}

/** Filtering, sorting or grouping on a hidden column would leak it through counts; refuse. */
export function refuseReading(hidden: Set<string>, columns: (string | undefined)[]) {
  const named = columns.find((column) => column && hidden.has(column))
  if (named) throw new ShareRefusedError(`"${named}" is redacted on this page`)
}

const withoutColumns = (result: QueryResult, hidden: Set<string>): QueryResult =>
  hidden.size === 0
    ? result
    : {
        ...result,
        rows: result.rows.map((row) =>
          Object.fromEntries(Object.entries(row).filter(([column]) => !hidden.has(column))),
        ),
      }

export function sharedQuery(
  ws: Workspace,
  token: string,
  query: InkQuery,
  page?: string,
): QueryResult {
  const { root } = sharedSheet(ws, token, page)
  const hidden = hiddenIn(ws, root, query.table)
  refuseReading(hidden, [
    ...(query.where ?? []).map((filter) => filter.column),
    query.orderBy?.column,
    query.groupBy?.column,
    ...(query.groupBy?.aggregates ?? []).map((aggregate) => aggregate.column),
  ])
  return withoutColumns(runQuery(ws, query), hidden)
}

export function sharedHistory(
  ws: Workspace,
  token: string,
  query: HistoryQuery,
  page?: string,
): QueryResult {
  const { root } = sharedSheet(ws, token, page)
  refuseReading(
    hiddenIn(ws, root, query.table),
    (query.where ?? []).map((filter) => filter.column),
  )
  return runHistory(ws, query)
}

/** A table's columns as the link sees them: redacted ones are not there at all. */
export function sharedTable(
  ws: Workspace,
  token: string,
  name: string,
  page?: string,
): TableSpec | null {
  const { root } = sharedSheet(ws, token, page)
  const hidden = hiddenIn(ws, root, name)
  const spec = getTableByName(ws, name)?.spec
  return spec
    ? { ...spec, columns: spec.columns.filter((column) => !hidden.has(column.name)) }
    : null
}

/**
 * A link serves only the uploads the page drawn uses — its look, or a block's file — and the icons
 * and covers of the pages it opens beside it, which its Subpages cards and links wear (D123).
 */
export function sharedFileAllowed(
  ws: Workspace,
  token: string,
  fileId: string,
  page?: string,
): boolean {
  const { sheet, root, home, tree } = sharedSheet(ws, token, page)
  const key = `file:${fileId}`
  const worn = [sheet, home, ...tree].some((each) => each.cover === key || each.icon === key)
  return worn || extractFiles(redactForShare(root)).includes(key)
}

/** Who reads a page, its live link, and what that link leaves out — the Share popover's view. */
export function shareSettings(ws: Workspace, id: string) {
  const sheet = getSheet(ws, id)
  const root = sheet ? parse(sheet.source) : null
  return {
    visibility: sheet?.visibility ?? 'shared',
    access: sheet?.access ?? [],
    token: liveShareFor(ws, id)?.token ?? null,
    suggest: sheet?.suggest ?? false,
    subpages: root ? sharesSubpages(root) : false,
    hidden: root ? redactionSummary(root) : { blocks: 0, columns: {} },
  }
}
