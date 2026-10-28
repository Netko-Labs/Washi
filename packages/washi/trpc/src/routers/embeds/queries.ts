import { embedHosts } from '@washi/service'
import { router, workspaceProcedure } from '../../init'

export const embedQueries = router({
  hosts: workspaceProcedure.query(({ ctx }) => embedHosts(ctx.ws)),
})
