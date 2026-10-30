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
  /** Bytes one upload a page or a Terminal reads may weigh (D119). */
  readCap: workspaceProcedure.query(({ ctx }) => codeLimits(ctx.ws).fileReadMb * 1024 * 1024),
  /** What a picker offers to attach: the workspace's newest uploads. */
  recent: workspaceProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(({ ctx, input }) => ctx.files.recent(input.limit)),
})
