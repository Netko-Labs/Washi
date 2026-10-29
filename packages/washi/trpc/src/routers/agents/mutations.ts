import { TRPCError } from '@trpc/server'
import {
  attachmentRefSchema,
  chatAnchorSchema,
  effortSchema,
  enabledModelSchema,
} from '@washi/domain'
import { createSession, isSessionVisible } from '@washi/repository'
import {
  APPROVAL_MODES,
  ChatMoveError,
  EFFORTS,
  INFERENCE_PREFERENCES,
  LOCAL_MODELS,
  RESUME_BY,
} from '@washi/service'
import { z } from 'zod'
import { isSteward, ownerProcedure, router, workspaceProcedure } from '../../init'
import { chatProcedure } from '../../shared/chats'

const decisionSchema = z.enum(['allow_once', 'allow_always', 'reject_once'])

export const agentMutations = router({
  /** A chat is its starter's (D67); one started from a page may be anchored to it. */
  createSession: workspaceProcedure
    .input(z.object({ title: z.string(), anchor: chatAnchorSchema.nullish() }))
    .mutation(({ ctx, input }) =>
      createSession(ctx.ws, input.title, { createdBy: ctx.viewer.id, anchor: input.anchor }),
    ),
  // Fire-and-forget: updates stream back over the agentUpdate subscription.
  prompt: chatProcedure
    .input(
      z.object({
        sessionId: z.string(),
        text: z.string(),
        attachments: z.array(attachmentRefSchema).max(8).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      // Refused here, before anything is recorded: a second prompt must not
      // touch the transcript or the session of the turn already running.
      if (ctx.host.isRunning(input.sessionId)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A turn is already running in this conversation. Stop it first.',
        })
      }
      void ctx.host
        .prompt(input.sessionId, input.text, {
          attachments: input.attachments,
          viewer: ctx.viewer,
        })
        .catch((error) => {
          console.error('[washi] a turn crashed outside its own error handling', error)
        })
    }),
  renameSession: chatProcedure
    .input(z.object({ sessionId: z.string(), title: z.string().trim().min(1).max(120) }))
    .mutation(({ ctx, input }) => ctx.host.renameSession(input.sessionId, input.title)),
  /** Its starter moves a chat to a page they can read, or Home with null (D110). */
  moveSession: chatProcedure
    .input(z.object({ sessionId: z.string(), sheetId: z.string().min(1).nullable() }))
    .mutation(({ ctx, input }) => {
      try {
        return ctx.host.moveSession(input.sessionId, input.sheetId, ctx.viewer)
      } catch (error) {
        if (error instanceof ChatMoveError) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'no such chat' })
        }
        throw error
      }
    }),
  /** Refused while it runs — Stop first. */
  deleteSession: chatProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ ctx, input }) => {
      try {
        ctx.host.deleteSession(input.sessionId)
      } catch (error) {
        throw new TRPCError({ code: 'CONFLICT', message: String(error) })
      }
      return { deleted: true }
    }),
  /** A conversation's own model and effort; null takes the workspace default (D61). */
  setSessionOptions: chatProcedure
    .input(
      z.object({
        sessionId: z.string(),
        model: z.string().min(1).max(200).nullable().optional(),
        effort: effortSchema.nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.host.setSessionOptions(input.sessionId, { model: input.model, effort: input.effort }),
    ),
  /** Stop the running turn. Its open approvals are answered "no" on the way out. */
  cancel: chatProcedure
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
  /** What the composer offers; null goes back to the recommended three. */
  setEnabledModels: ownerProcedure
    .input(z.object({ models: z.array(enabledModelSchema).max(40).nullable() }))
    .mutation(({ ctx, input }) => ctx.host.setEnabledModels(input.models)),
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
      const request = ctx.host.pendingApprovals().find((pending) => pending.id === input.id)
      if (request && !isSessionVisible(ctx.ws, request.sessionId, ctx.viewer.id)) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'no such question' })
      }
      ctx.host.resolveApprovalRequest(input.id, input.decision, ctx.actorId)
    }),
})
