import { TRPCError } from '@trpc/server'
import { createSession } from '@washi/repository'
import {
  APPROVAL_MODES,
  EFFORTS,
  INFERENCE_PREFERENCES,
  LOCAL_MODELS,
  RESUME_BY,
} from '@washi/service'
import { z } from 'zod'
import { isSteward, ownerProcedure, router, workspaceProcedure } from '../../init'

const decisionSchema = z.enum(['allow_once', 'allow_always', 'reject_once'])

export const agentMutations = router({
  createSession: workspaceProcedure
    .input(z.object({ title: z.string() }))
    .mutation(({ ctx, input }) => createSession(ctx.ws, input.title)),
  // Fire-and-forget: updates stream back over the agentUpdate subscription.
  prompt: workspaceProcedure
    .input(z.object({ sessionId: z.string(), text: z.string() }))
    .mutation(({ ctx, input }) => {
      // Refused here, before anything is recorded: a second prompt must not
      // touch the transcript or the session of the turn already running.
      if (ctx.host.isRunning(input.sessionId)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A turn is already running in this conversation. Stop it first.',
        })
      }
      void ctx.host.prompt(input.sessionId, input.text).catch((error) => {
        console.error('[washi] a turn crashed outside its own error handling', error)
      })
    }),
  /** Stop the running turn. Its open approvals are answered "no" on the way out. */
  cancel: workspaceProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ ctx, input }) => ({ cancelled: ctx.host.cancel(input.sessionId) })),
  /** Clearing the breaker is a person's decision — nothing clears it on a timer. */
  resume: workspaceProcedure.mutation(async ({ ctx }) => {
    if (ctx.host.settings().resumeBy === 'owners' && !(await isSteward(ctx))) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'this workspace lets only an owner resume Washi',
      })
    }
    ctx.host.resume()
    return ctx.host.spend()
  }),
  /** A person's stop, held until a person resumes — the breaker, pulled by hand. */
  pause: ownerProcedure.mutation(({ ctx }) => ctx.host.pause()),
  /** The backstop for models with no price: every turn counts toward it. */
  setTurnCap: ownerProcedure
    .input(z.object({ turnCap: z.number().int().positive().max(100_000) }))
    .mutation(({ ctx, input }) => ctx.host.setTurnCap(input.turnCap)),
  setResumeBy: ownerProcedure
    .input(z.object({ resumeBy: z.enum(RESUME_BY) }))
    .mutation(({ ctx, input }) => ctx.host.setResumeBy(input.resumeBy)),
  /** What a new conversation and every routine start with. */
  setDefaultEffort: workspaceProcedure
    .input(z.object({ effort: z.enum(EFFORTS) }))
    .mutation(({ ctx, input }) => ctx.host.setDefaultEffort(input.effort)),
  /** Auto is a standing yes for fetches, searches and actions — the ledger still records each. */
  setApprovalMode: ownerProcedure
    .input(z.object({ mode: z.enum(APPROVAL_MODES) }))
    .mutation(({ ctx, input }) => ({ mode: ctx.host.setApprovalMode(input.mode) })),
  /** The daily stop. A person sets it; the breaker reads it before every turn. */
  setDailyCap: workspaceProcedure
    .input(z.object({ capUsd: z.number().positive().max(10_000) }))
    .mutation(({ ctx, input }) => ctx.host.setDailyCap(input.capUsd)),
  /** Embedded only: Claude Code on this computer, the env key, or whichever is there. */
  setInference: workspaceProcedure
    .input(z.object({ preference: z.enum(INFERENCE_PREFERENCES) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.mode !== 'embedded') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'a hosted workspace runs on its own key — there is nothing to pick',
        })
      }
      return ctx.host.setInference(input.preference)
    }),
  /** Embedded only: which model the local Claude Code runs. Opus spends plan limits fastest. */
  setLocalModel: workspaceProcedure
    .input(z.object({ model: z.enum(LOCAL_MODELS) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.mode !== 'embedded') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'a hosted workspace has no local Claude Code',
        })
      }
      return ctx.host.setLocalModel(input.model)
    }),
  resolveApproval: workspaceProcedure
    .input(z.object({ id: z.string(), decision: decisionSchema }))
    .mutation(({ ctx, input }) => {
      ctx.host.resolveApprovalRequest(input.id, input.decision, ctx.actorId)
    }),
})
