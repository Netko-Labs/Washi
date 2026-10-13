import { createModelCatalogue } from '@washi/models'
import { z } from 'zod'
import { publicProcedure, router } from '../../init'

// One catalogue per process. The payload is ~4.7MB and refreshes daily, so it
// is never fetched per request, and never per turn.
const catalogue = createModelCatalogue()

export const modelQueries = router({
  /**
   * Every model Washi can actually drive: a provider it has an SDK for, and a
   * model that can call a tool. Falls back to a bundled floor when models.dev
   * is unreachable, and says which it used.
   */
  list: publicProcedure
    .input(z.object({ provider: z.string().optional() }).optional())
    .query(async ({ input }) => ({
      models: await catalogue.list(input?.provider),
      source: catalogue.source(),
    })),
})
