import type { FileStore, Workspace } from '@washi/repository'
import { z } from 'zod'
import {
  formatOf,
  type ImportFormat,
  type ImportSource,
  importRows,
  MAX_IMPORT_CHARS,
  MAX_IMPORT_ROWS,
} from '../tables/import'
import { capability } from './define'
import type { Capability, CapabilityContext } from './types'
import { DB_IMPORT_DESCRIPTION } from './values'

const FILE_KEY = /^file:[a-z0-9-]{1,48}$/
const TEXT_TYPES = /^text\/|^application\/(json|x-ndjson)$/

/**
 * An upload's words, for an import: UTF-8 text in a format it reads (said, or read off its type and
 * name), else refused in words — a spreadsheet's own format is exported to CSV first.
 */
async function sourceOfFile(
  files: FileStore | undefined,
  key: string,
  said?: ImportFormat,
): Promise<ImportSource> {
  if (!files) throw new Error('this server keeps no uploads here: send csv or json instead')
  const found = await files.get(key.slice('file:'.length))
  if (!found) throw new Error(`no upload ${key} in this workspace — file_upload answers its key`)
  const format = said ?? formatOf(found.file.mime, found.file.name)
  if (!format || !TEXT_TYPES.test(found.file.mime)) {
    throw new Error(
      `${found.file.name} (${found.file.mime}) is not CSV, TSV or JSON — export it as CSV first, or pass format`,
    )
  }
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(found.bytes), format }
  } catch {
    throw new Error(`${found.file.name} is not UTF-8 text — save it as UTF-8 and upload it again`)
  }
}

/**
 * Bulk rows into a table from a file (D137): an upload by key, or CSV/JSON sent inline. Signed by
 * the context's author like `db_mutate`, through the same write (P1).
 */
export function rowImportCapabilities(
  ws: Workspace,
  context: CapabilityContext,
  files?: FileStore,
): Capability[] {
  return [
    capability(
      'db_import',
      DB_IMPORT_DESCRIPTION,
      {
        table: z.string().min(1),
        file: z
          .string()
          .regex(FILE_KEY, 'an upload key, file:<id>')
          .optional()
          .describe('An uploaded .csv, .tsv, .json or .jsonl: the key file_upload answered'),
        csv: z
          .string()
          .min(1)
          .max(MAX_IMPORT_CHARS)
          .optional()
          .describe('CSV or TSV text, a header row first'),
        json: z
          .union([
            z.string().min(1).max(MAX_IMPORT_CHARS),
            z.array(z.unknown()).max(MAX_IMPORT_ROWS),
          ])
          .optional()
          .describe('An array of row objects, or JSON / JSON Lines text'),
        format: z.enum(['csv', 'tsv', 'json', 'jsonl']).optional(),
        delimiter: z
          .string()
          .length(1)
          .optional()
          .describe('A CSV separator other than , or a tab'),
        map: z
          .record(z.string(), z.string().nullable())
          .optional()
          .describe('Source column → table column; null leaves a column out'),
        dryRun: z.boolean().optional().describe('Read and check every row; write nothing'),
      },
      false,
      async ({ table, file, csv, json, format, delimiter, map, dryRun }) => {
        const given = [file, csv, json].filter((each) => each !== undefined).length
        if (given !== 1) throw new Error('send exactly one of file, csv or json')
        const source: ImportSource = file
          ? await sourceOfFile(files, file, format)
          : Array.isArray(json)
            ? { text: '', rows: json }
            : { text: (csv ?? json) as string, format: format ?? (csv ? undefined : 'json') }
        if (format) source.format = format
        if (delimiter) source.delimiter = delimiter
        return importRows(ws, table, source, { map, dryRun }, context.author)
      },
    ),
  ]
}
