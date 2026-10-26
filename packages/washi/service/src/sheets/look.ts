import type { SheetDetail, SheetLook, SheetMetaPatch } from '@washi/domain'
import {
  getAppMeta,
  getSheet,
  rewriteSourceQuietly,
  setAppMeta,
  sheetsWearingLooks,
  updateSheetMeta,
  type Workspace,
} from '@washi/repository'
import { parse, serialize } from '@washi/wsx'
import { lookOf, withLook } from './look-of'
import { checkSource, requireSheet, updateSheetFromSource } from './service'

const LIFTED = 'look_in_source'

/**
 * Title and width stay metadata; an icon or a cover is written into the page itself, so it
 * merges, shows in source, and counts as the person's edit.
 */
export function updateSheetMetaAndLook(
  ws: Workspace,
  id: string,
  patch: SheetMetaPatch,
): SheetDetail {
  const { icon, cover, title, fullWidth } = patch
  if (icon !== undefined || cover !== undefined) {
    const sheet = requireSheet(ws, id)
    const source = serialize(withLook(parse(sheet.source), { icon, cover }))
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
  for (const sheet of sheetsWearingLooks(ws)) {
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
