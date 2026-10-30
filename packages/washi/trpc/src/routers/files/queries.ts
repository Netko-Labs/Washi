import { uploadCaps } from '@washi/domain'
import { codeLimits } from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const fileQueries = router({
  info: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => ctx.files.info(input.id)),
  /** Bytes each kind may weigh here, so a picker refuses before it uploads (D118). */
  caps: workspaceProcedure.query(({ ctx }) => uploadCaps(codeLimits(ctx.ws))),
})
