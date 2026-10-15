import { routineCreateSchema } from '@washi/domain'
import { mutationSchema, tableSpecSchema } from '@washi/ink'
import {
  defineUserTable,
  openRowPage,
  runMutation,
  seedTeamSpace,
  toggleTaskRecord,
} from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const tableMutations = router({
  define: workspaceProcedure
    .input(z.object({ spec: tableSpecSchema }))
    .mutation(({ ctx, input }) => defineUserTable(ctx.ws, input.spec)),
  mutate: workspaceProcedure
    .input(z.object({ mutation: mutationSchema }))
    .mutation(({ ctx, input }) => runMutation(ctx.ws, input.mutation)),
  /** Notion's "open as page": the row's page, made on first open. */
  openRow: workspaceProcedure
    .input(z.object({ recordId: z.string() }))
    .mutation(({ ctx, input }) => ({ sheetId: openRowPage(ctx.ws, input.recordId) })),
  /** Backlog, roadmap, wiki, ideas and a weekly review, on the asker's clock. */
  seedTeamSpace: workspaceProcedure
    .input(routineCreateSchema.pick({ timeZone: true }))
    .mutation(({ ctx, input }) =>
      seedTeamSpace(ctx.ws, { timeZone: input.timeZone, actorId: ctx.actorId }),
    ),
  toggleTask: workspaceProcedure
    .input(z.object({ recordId: z.string(), done: z.boolean() }))
    .mutation(({ ctx, input }) => {
      toggleTaskRecord(ctx.ws, input.recordId, input.done)
    }),
})
