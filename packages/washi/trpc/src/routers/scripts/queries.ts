import { getSheet } from '@washi/repository'
import {
  compilePage,
  compileScript,
  compileWidget,
  PAGE_CODE_MAX_CHARS,
  pagePackagesOf,
  readableSet,
  SCRIPT_MAX_CHARS,
} from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

/** TSX → the JS the sandbox runs. Pure: the same source compiles the same everywhere. */
export const scriptQueries = router({
  compile: workspaceProcedure
    .input(
      z.object({
        source: z.string().max(SCRIPT_MAX_CHARS + 1),
        entry: z
          .string()
          .regex(/^[a-z][A-Za-z0-9_]{0,39}$/)
          .optional(),
      }),
    )
    .query(({ input }) => compileScript(input.source, input.entry)),
  /** A page that runs, bundled for the reader's sandbox; a `page:` import resolves only to a page they read. */
  page: workspaceProcedure
    .input(z.object({ source: z.string().max(PAGE_CODE_MAX_CHARS + 1) }))
    .query(({ ctx, input }) => {
      const readable = readableSet(ctx.ws, ctx.viewer)
      return compilePage(
        input.source,
        (id) => (readable.has(id) ? (getSheet(ctx.ws, id)?.source ?? null) : null),
        pagePackagesOf(ctx.ws),
      )
    }),
  /** One of a page's components bundled with React for a widget's frame (D113), imports as `page`. */
  widget: workspaceProcedure
    .input(
      z.object({
        source: z.string().max(PAGE_CODE_MAX_CHARS + 1),
        component: z.string().regex(/^[A-Z][A-Za-z0-9_]{0,63}$/),
      }),
    )
    .query(({ ctx, input }) => {
      const readable = readableSet(ctx.ws, ctx.viewer)
      return compileWidget(
        input.source,
        input.component,
        (id) => (readable.has(id) ? (getSheet(ctx.ws, id)?.source ?? null) : null),
        pagePackagesOf(ctx.ws),
      )
    }),
})
