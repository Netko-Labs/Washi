import { listWorkspaceThemes } from '@washi/repository'
import { router, workspaceProcedure } from '../../init'

export const themeQueries = router({
  list: workspaceProcedure.query(({ ctx }) => listWorkspaceThemes(ctx.ws)),
})
