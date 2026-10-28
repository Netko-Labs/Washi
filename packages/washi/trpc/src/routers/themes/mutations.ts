import { workspaceThemeWriteSchema } from '@washi/domain'
import {
  addWorkspaceTheme,
  editWorkspaceTheme,
  LOCAL_AUTHOR,
  removeWorkspaceTheme,
} from '@washi/service'
import { z } from 'zod'
import { isSteward, router, workspaceProcedure } from '../../init'

/** Anyone in the workspace makes a theme; its maker or a steward changes or removes it. */
export const themeMutations = router({
  add: workspaceProcedure
    .input(workspaceThemeWriteSchema)
    .mutation(({ ctx, input }) =>
      addWorkspaceTheme(ctx.ws, input, ctx.actor?.id ?? LOCAL_AUTHOR.id),
    ),
  update: workspaceProcedure
    .input(z.object({ id: z.string(), write: workspaceThemeWriteSchema }))
    .mutation(async ({ ctx, input }) => {
      const by = { id: ctx.actor?.id ?? LOCAL_AUTHOR.id, mayChangeAny: await isSteward(ctx) }
      return editWorkspaceTheme(ctx.ws, input.id, input.write, by)
    }),
  remove: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const by = { id: ctx.actor?.id ?? LOCAL_AUTHOR.id, mayChangeAny: await isSteward(ctx) }
      removeWorkspaceTheme(ctx.ws, input.id, by)
      return { removed: true }
    }),
})
