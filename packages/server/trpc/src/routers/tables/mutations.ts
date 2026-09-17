import { mutationSchema, tableSpecSchema } from '@washi/ink'
import { defineUserTable, runMutation, toggleTaskRecord } from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const tableMutations = router({
  define: workspaceProcedure
    .input(z.object({ spec: tableSpecSchema }))
    .mutation(({ ctx, input }) => defineUserTable(ctx.ws, input.spec)),
  mutate: workspaceProcedure
    .input(z.object({ mutation: mutationSchema }))
    .mutation(({ ctx, input }) => runMutation(ctx.ws, input.mutation)),
  toggleTask: workspaceProcedure
    .input(z.object({ recordId: z.string(), done: z.boolean() }))
    .mutation(({ ctx, input }) => {
      toggleTaskRecord(ctx.ws, input.recordId, input.done)
    }),
})
