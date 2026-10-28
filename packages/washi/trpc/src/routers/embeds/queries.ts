import { embedHosts, widgetsEnabled } from '@washi/service'
import { router, workspaceProcedure } from '../../init'

export const embedQueries = router({
  hosts: workspaceProcedure.query(({ ctx }) => embedHosts(ctx.ws)),
  widgets: workspaceProcedure.query(({ ctx }) => widgetsEnabled(ctx.ws)),
})
