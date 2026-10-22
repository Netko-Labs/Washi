import { sheetMetaPatchSchema, sheetWriteSchema } from '@washi/domain'
import {
  emptyTrash,
  purgeSheet,
  sheetVersion,
  trashedFileCovers,
  updateSheetMeta,
} from '@washi/repository'
import {
  createSheetFromSource,
  duplicateSheet,
  moveSheetTo,
  removeSheet,
  restoreSheetTree,
  undoWashiWrite,
  updateSheetFromSource,
} from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

const byId = z.object({ id: z.string() })

export const sheetMutations = router({
  create: workspaceProcedure
    .input(z.object({ write: sheetWriteSchema, parentId: z.string().nullable().optional() }))
    .mutation(({ ctx, input }) =>
      createSheetFromSource(ctx.ws, input.write, input.parentId ?? null),
    ),
  /** With `baseVersion` (from `get`), a write merges with whatever landed since it was read. */
  update: workspaceProcedure
    .input(
      z.object({ id: z.string(), write: sheetWriteSchema, baseVersion: z.string().optional() }),
    )
    .mutation(({ ctx, input }) => {
      const sheet = updateSheetFromSource(ctx.ws, input.id, input.write, null, input.baseVersion)
      return { ...sheet, version: sheetVersion(ctx.ws, input.id) ?? undefined }
    }),
  undoWashi: workspaceProcedure
    .input(byId)
    .mutation(({ ctx, input }) => undoWashiWrite(ctx.ws, input.id)),
  updateMeta: workspaceProcedure
    .input(z.object({ id: z.string(), patch: sheetMetaPatchSchema }))
    .mutation(({ ctx, input }) => {
      const sheet = updateSheetMeta(ctx.ws, input.id, input.patch)
      if (!sheet) throw new Error(`sheet not found: ${input.id}`)
      return sheet
    }),
  duplicate: workspaceProcedure
    .input(byId)
    .mutation(({ ctx, input }) => duplicateSheet(ctx.ws, input.id)),
  remove: workspaceProcedure.input(byId).mutation(({ ctx, input }) => {
    removeSheet(ctx.ws, input.id)
  }),
  move: workspaceProcedure
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
  restore: workspaceProcedure
    .input(byId)
    .mutation(({ ctx, input }) => restoreSheetTree(ctx.ws, input.id)),
  purge: workspaceProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const covers = trashedFileCovers(ctx.ws, input.id)
    const purged = purgeSheet(ctx.ws, input.id)
    await Promise.all(covers.map((id) => ctx.files.remove(id)))
    return purged
  }),
  emptyTrash: workspaceProcedure.mutation(async ({ ctx }) => {
    const covers = trashedFileCovers(ctx.ws)
    const emptied = emptyTrash(ctx.ws)
    await Promise.all(covers.map((id) => ctx.files.remove(id)))
    return emptied
  }),
})
