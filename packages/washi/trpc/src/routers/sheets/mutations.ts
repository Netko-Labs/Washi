import { sheetWriteSchema } from '@washi/domain'
import { createSheetFromSource, removeSheet, updateSheetFromSource } from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const sheetMutations = router({
  create: workspaceProcedure
    .input(z.object({ write: sheetWriteSchema }))
    .mutation(({ ctx, input }) => createSheetFromSource(ctx.ws, input.write)),
  update: workspaceProcedure
    .input(z.object({ id: z.string(), write: sheetWriteSchema }))
    .mutation(({ ctx, input }) => updateSheetFromSource(ctx.ws, input.id, input.write)),
  remove: workspaceProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    removeSheet(ctx.ws, input.id)
  }),
})
