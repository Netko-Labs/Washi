import { router, workspaceProcedure } from '../../init'

export const routineQueries = router({
  list: workspaceProcedure.query(({ ctx }) => ctx.host.routines.list()),
})
