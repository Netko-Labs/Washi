import { sheetMetaPatchSchema, sheetWriteSchema } from '@washi/domain'
import { emptyTrash, listTrash, purgeSheet, sheetVersion, trashedUploads } from '@washi/repository'
import {
  createSheetFromSource,
  duplicateSheet,
  moveSheetTo,
  readableSet,
  removeSheet,
  restoreSheetTree,
  undoWashiWrite,
  updateSheetAccess,
  updateSheetFromSource,
  updateSheetMetaAndLook,
  updateSheetSuggest,
} from '@washi/service'
import { z } from 'zod'
import { pageProcedure, router, workspaceProcedure } from '../../init'

const byId = z.object({ id: z.string() })

export const sheetMutations = router({
  create: pageProcedure
    .input(z.object({ write: sheetWriteSchema, parentId: z.string().nullable().optional() }))
    .mutation(({ ctx, input }) =>
      createSheetFromSource(ctx.ws, input.write, input.parentId ?? null),
    ),
  /** With `baseVersion` (from `get`), a write merges with whatever landed since it was read. */
  update: pageProcedure
    .input(
      z.object({ id: z.string(), write: sheetWriteSchema, baseVersion: z.string().optional() }),
    )
    .mutation(({ ctx, input }) => {
      const sheet = updateSheetFromSource(ctx.ws, input.id, input.write, null, input.baseVersion)
      return { ...sheet, version: sheetVersion(ctx.ws, input.id) ?? undefined }
    }),
  undoWashi: pageProcedure
    .input(byId)
    .mutation(({ ctx, input }) => undoWashiWrite(ctx.ws, input.id)),
  updateMeta: pageProcedure
    .input(z.object({ id: z.string(), patch: sheetMetaPatchSchema }))
    .mutation(({ ctx, input }) => updateSheetMetaAndLook(ctx.ws, input.id, input.patch)),
  duplicate: pageProcedure
    .input(byId)
    .mutation(({ ctx, input }) => duplicateSheet(ctx.ws, input.id)),
  remove: pageProcedure.input(byId).mutation(({ ctx, input }) => {
    removeSheet(ctx.ws, input.id)
  }),
  move: pageProcedure
    .input(
      z.object({
        id: z.string(),
        parentId: z.string().nullable(),
        index: z.number().int().min(0),
      }),
    )
    .mutation(({ ctx, input }) => {
      moveSheetTo(ctx.ws, input.id, input.parentId, input.index)
    }),
  restore: pageProcedure
    .input(byId)
    .mutation(({ ctx, input }) => restoreSheetTree(ctx.ws, input.id, ctx.viewer.id)),
  purge: pageProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const uploads = trashedUploads(ctx.ws, input.id)
    const purged = purgeSheet(ctx.ws, input.id)
    await Promise.all(uploads.map((id) => ctx.files.remove(id)))
    return purged
  }),
  setAccess: pageProcedure
    .input(
      z.object({
        id: z.string(),
        visibility: z.enum(['private', 'shared', 'public']),
        access: z.array(z.string().min(1).max(80)).max(64),
      }),
    )
    .mutation(({ ctx, input }) => updateSheetAccess(ctx.ws, input.id, input, ctx.viewer.id)),
  /** Whether the page's link takes suggested rows (D120): a person's switch, never Washi's. */
  setSuggest: pageProcedure
    .input(z.object({ id: z.string(), suggest: z.boolean() }))
    .mutation(({ ctx, input }) => updateSheetSuggest(ctx.ws, input.id, input.suggest)),
  /** Empties what this person can see; private pages of others stay in the Trash. */
  emptyTrash: workspaceProcedure.mutation(async ({ ctx }) => {
    if (!ctx.viewer.isOwner) {
      const readable = readableSet(ctx.ws, ctx.viewer)
      let emptied = 0
      for (const entry of listTrash(ctx.ws).filter((page) => readable.has(page.id))) {
        const uploads = trashedUploads(ctx.ws, entry.id)
        emptied += purgeSheet(ctx.ws, entry.id) ? 1 : 0
        await Promise.all(uploads.map((id) => ctx.files.remove(id)))
      }
      return emptied
    }
    const uploads = trashedUploads(ctx.ws)
    const emptied = emptyTrash(ctx.ws)
    await Promise.all(uploads.map((id) => ctx.files.remove(id)))
    return emptied
  }),
})
