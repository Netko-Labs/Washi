import { z } from 'zod'
import { adminProcedure, router, SIGNUP_MODES } from '../../init'

export const instanceMutations = router({
  setSignup: adminProcedure
    .input(z.object({ mode: z.enum(SIGNUP_MODES) }))
    .mutation(({ ctx, input }) => ctx.instance.setSignup(input.mode)),
})
