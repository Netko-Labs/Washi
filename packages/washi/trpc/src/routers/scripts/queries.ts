import { compileScript, SCRIPT_MAX_CHARS } from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

/** TSX → the JS the sandbox runs. Pure: the same source compiles the same everywhere. */
export const scriptQueries = router({
  compile: workspaceProcedure
    .input(
      z.object({
        source: z.string().max(SCRIPT_MAX_CHARS + 1),
        entry: z.enum(['view', 'run']).optional(),
      }),
    )
    .query(({ input }) => compileScript(input.source, input.entry)),
})
