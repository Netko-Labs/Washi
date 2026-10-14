import { sheetWriteSchema } from '@washi/domain'
import { emptyTrash, purgeSheet } from '@washi/repository'
import {
  createSheetFromSource,
  moveSheetTo,
  removeSheet,
  restoreSheetTree,
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
  update: workspaceProcedure
    .input(z.object({ id: z.string(), write: sheetWriteSchema }))
    .mutation(({ ctx, input }) => updateSheetFromSource(ctx.ws, input.id, input.write)),
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
  purge: workspaceProcedure.input(byId).mutation(({ ctx, input }) => purgeSheet(ctx.ws, input.id)),
  emptyTrash: workspaceProcedure.mutation(({ ctx }) => emptyTrash(ctx.ws)),
})
