import { timeZoneSchema } from '@washi/domain'
import { mutationSchema, tableSpecSchema } from '@washi/ink'
import {
  defineUserTable,
  openRowPage,
  purgeUserTable,
  restoreUserTable,
  runMutation,
  seedTeamSpace,
  toggleTaskRecord,
  trashUserTable,
} from '@washi/service'
import { z } from 'zod'
import { ownerProcedure, router, workspaceProcedure } from '../../init'

const byId = z.object({ id: z.string() })

export const tableMutations = router({
  define: workspaceProcedure
    .input(z.object({ spec: tableSpecSchema }))
    .mutation(({ ctx, input }) => defineUserTable(ctx.ws, input.spec)),
  mutate: workspaceProcedure
    .input(z.object({ mutation: mutationSchema }))
    .mutation(({ ctx, input }) => runMutation(ctx.ws, input.mutation, ctx.viewer.id)),
  /** A member trashes and restores a table as they would a page; its rows wait untouched (D109). */
  trash: workspaceProcedure
    .input(byId)
    .mutation(({ ctx, input }) => trashUserTable(ctx.ws, input.id)),
  restore: workspaceProcedure
    .input(byId)
    .mutation(({ ctx, input }) => restoreUserTable(ctx.ws, input.id)),
  /** Gone for good, rows and history: an owner's or an admin's call. */
  purge: ownerProcedure.input(byId).mutation(({ ctx, input }) => purgeUserTable(ctx.ws, input.id)),
  /** Notion's "open as page": the row's page, made on first open. */
  openRow: workspaceProcedure
    .input(z.object({ recordId: z.string() }))
    .mutation(({ ctx, input }) => ({ sheetId: openRowPage(ctx.ws, input.recordId) })),
  /** Backlog, roadmap, wiki, ideas and a weekly review, on the asker's clock. */
  seedTeamSpace: workspaceProcedure
    .input(z.object({ timeZone: timeZoneSchema }))
    .mutation(({ ctx, input }) =>
      seedTeamSpace(ctx.ws, { timeZone: input.timeZone, actorId: ctx.actorId }),
    ),
  toggleTask: workspaceProcedure
    .input(
      z.object({
        recordId: z.string(),
        done: z.boolean(),
        field: z.string().min(1).max(64).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      toggleTaskRecord(ctx.ws, input.recordId, input.done, input.field, ctx.viewer.id)
    }),
})
