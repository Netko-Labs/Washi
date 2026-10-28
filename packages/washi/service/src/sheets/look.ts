import type { SheetAccess, SheetDetail, SheetLook, SheetMetaPatch } from '@washi/domain'
import {
  everySheetSource,
  getAppMeta,
  getSheet,
  openShare,
  rewriteSourceQuietly,
  setAppMeta,
  updateSheetMeta,
  type Workspace,
} from '@washi/repository'
import { parse, serialize } from '@washi/wsx'
import { lookOf, withLook } from './look-of'
import { checkSource, requireSheet, updateSheetFromSource } from './service'

const LIFTED = 'look_in_source'

/**
 * Title and width stay metadata; an icon, a cover or a theme is written into the page itself, so it
 * merges, shows in source, and counts as the person's edit.
 */
export function updateSheetMetaAndLook(
  ws: Workspace,
  id: string,
  patch: SheetMetaPatch,
): SheetDetail {
  const { icon, cover, theme, title, fullWidth } = patch
  if (icon !== undefined || cover !== undefined || theme !== undefined) {
    const sheet = requireSheet(ws, id)
    const source = serialize(withLook(parse(sheet.source), { icon, cover, theme }))
    updateSheetFromSource(ws, id, { title: sheet.title, tags: sheet.tags, source })
  }
  if (title !== undefined || fullWidth !== undefined) updateSheetMeta(ws, id, { title, fullWidth })
  const updated = getSheet(ws, id)
  if (!updated) throw new Error(`sheet not found: ${id}`)
  return updated
}

// A cover picked before D60 is a bare preset name.
const keyed = (cover: string) => (cover.includes(':') ? cover : `preset:${cover}`)

/**
 * Once per workspace: a look picked before D64 lived only in the columns. Write it into the
 * source the page already has, quietly; a page whose source would not validate keeps its columns.
 */
export function liftLooksIntoSource(ws: Workspace): void {
  if (getAppMeta(ws, LIFTED)) return
  for (const sheet of everySheetSource(ws)) {
    let root: ReturnType<typeof parse>
    try {
      root = parse(sheet.source)
    } catch {
      continue
    }
    const worn = lookOf(root)
    const missing: Partial<SheetLook> = {}
    if (sheet.icon && !worn.icon) missing.icon = sheet.icon
    if (sheet.cover && !worn.cover) missing.cover = keyed(sheet.cover)
    if (Object.keys(missing).length === 0) continue
    const source = serialize(withLook(root, missing))
    if (!checkSource(source).ok) continue
    rewriteSourceQuietly(ws, sheet.id, source, { ...worn, ...missing })
  }
  setAppMeta(ws, LIFTED, '1')
}

const ENFORCED = 'visibility_enforced'

/**
 * Once per workspace: before D65 a `<Sheet visibility>` was carried and never enforced, so one
 * written then could hide a page or open a link the day it starts to count. Drop those, quietly;
 * from here on only a person sets who reads a page.
 */
export function forgetUnenforcedVisibility(ws: Workspace): void {
  if (getAppMeta(ws, ENFORCED)) return
  for (const sheet of everySheetSource(ws)) {
    let root: ReturnType<typeof parse>
    try {
      root = parse(sheet.source)
    } catch {
      continue
    }
    if (root.props.visibility === undefined && root.props.access === undefined) continue
    const { visibility: _visibility, access: _access, ...props } = root.props
    const source = serialize({ ...root, props })
    if (!checkSource(source).ok) continue
    rewriteSourceQuietly(ws, sheet.id, source, lookOf(root))
  }
  setAppMeta(ws, ENFORCED, '1')
}

/**
 * A person sets who reads a page: the `<Sheet>` props move through the ordinary write, and the
 * page's link opens or closes with `public` (D65). Whoever narrows a page keeps reading it.
 */
export function updateSheetAccess(
  ws: Workspace,
  id: string,
  next: SheetAccess,
  by: string | null,
): SheetDetail {
  const sheet = requireSheet(ws, id)
  const access =
    next.visibility === 'private' && by && !next.access.includes(by)
      ? [by, ...next.access]
      : next.access
  const root = parse(sheet.source)
  const { visibility: _visibility, access: _access, ...props } = root.props
  const source = serialize({
    ...root,
    props: {
      ...props,
      ...(next.visibility !== 'shared' && { visibility: next.visibility }),
      ...(next.visibility === 'private' && access.length > 0 && { access }),
    },
  })
  const updated = updateSheetFromSource(ws, id, { title: sheet.title, tags: sheet.tags, source })
  if (by && next.visibility === 'public') openShare(ws, id, by)
  return updated
}
