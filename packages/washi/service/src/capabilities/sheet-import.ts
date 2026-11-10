import type { FileStore, Workspace } from '@washi/repository'
import { z } from 'zod'
import { pagesFor } from '../agents/lib/pages'
import { MAX_MARKDOWN_CHARS, markdownToPage } from '../markdown'
import { checkSource, createSheetFromSource } from '../sheets/service'
import { capability } from './define'
import type { Capability, CapabilityContext } from './types'
import { editedByOf, previewOf, writtenAnswer } from './utils'
import { MARKDOWN_FILE, MARKDOWN_TYPES, SHEET_IMPORT_DESCRIPTION } from './values'

/** An uploaded Markdown or text file's words, refused in words when it is anything else. */
async function markdownFile(files: FileStore | undefined, key: string): Promise<string> {
  if (!files) throw new Error('this server keeps no files for an import here — send markdown')
  const found = await files.get(key.slice('file:'.length))
  if (!found) throw new Error(`no upload ${key} in this workspace — file_upload makes one`)
  const { mime, name } = found.file
  if (!MARKDOWN_TYPES.has(mime) && !MARKDOWN_FILE.test(name)) {
    throw new Error(`${key} is ${mime} ("${name}") — sheet_import reads Markdown or plain text`)
  }
  return new TextDecoder().decode(found.bytes)
}

/**
 * Markdown in, a page out (D136): a README or a spec moved in one call, converted, checked like
 * sheet_check and written as the member — or, on a dry run, answered as WSX to reshape first.
 */
export function sheetImportCapabilities(
  ws: Workspace,
  context: CapabilityContext,
  files?: FileStore,
): Capability[] {
  const pages = pagesFor(ws, context.viewer)
  const written = writtenAnswer(ws, context)
  return [
    capability(
      'sheet_import',
      SHEET_IMPORT_DESCRIPTION,
      {
        markdown: z.string().min(1).max(MAX_MARKDOWN_CHARS).optional(),
        file: z
          .string()
          .regex(/^file:[a-z0-9-]{1,48}$/, 'an upload key, file:<id>')
          .optional(),
        title: z.string().min(1).max(200).optional(),
        parentId: z.string().optional(),
        dryRun: z.boolean().optional(),
      },
      false,
      async ({ markdown, file, title, parentId, dryRun }) => {
        if (Boolean(markdown) === Boolean(file)) {
          throw new Error('send markdown (the text) or file (file:<id> of an uploaded .md), one')
        }
        const text = markdown ?? (await markdownFile(files, file ?? ''))
        const page = markdownToPage(text, { title })
        const check = checkSource(page.source, ws)
        if (dryRun) {
          return {
            ...check,
            title: page.title,
            source: page.source,
            preview: previewOf(page.source),
            kept: page.kept,
          }
        }
        if (!check.ok) {
          const errors = check.diagnostics.filter((each) => each.severity === 'error')
          throw new Error(
            `the page made from that Markdown does not pass sheet_check: ${errors
              .map((each) => each.message)
              .join('; ')} — dryRun: true answers its WSX to fix and sheet_create`,
          )
        }
        if (parentId) pages.require(parentId)
        const sheet = createSheetFromSource(
          ws,
          { title: page.title, source: page.source },
          parentId ?? null,
          editedByOf(context),
        )
        context.onCreate?.(sheet.id)
        return { ...written(sheet), kept: page.kept }
      },
    ),
  ]
}
