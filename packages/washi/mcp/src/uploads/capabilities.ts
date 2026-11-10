import { largestUpload, uploadCaps, uploadKindOf, uploadName, uploadRefusal } from '@washi/domain'
import { recordCapability } from '@washi/repository'
import {
  type Capability,
  capability,
  codeLimits,
  fileTypeOf,
  privateNetworkAllowed,
} from '@washi/service'
import { fetchFile, TsuruError } from '@washi/tsuru'
import { z } from 'zod'
import type { McpSession } from '../types'
import { issueTicket } from './tickets'
import { FILE_UPLOAD_FROM_DESCRIPTION, FILE_UPLOAD_URL_DESCRIPTION, RUNNABLE_TYPES } from './values'

/** Why a fetch failed, in words: tsuru's own, a timeout, or the error as it came. */
const failureWords = (cause: unknown) =>
  cause instanceof TsuruError
    ? cause.message
    : cause instanceof Error && cause.name === 'TimeoutError'
      ? 'the host took too long to answer'
      : cause instanceof Error
        ? cause.message
        : String(cause)

/** A refusal in the words an upload anywhere would get; SVG says why. */
const refusalWords = (mime: string, refusal: string) =>
  mime === 'image/svg+xml'
    ? `${refusal}: SVG can run when served — upload a PNG`
    : RUNNABLE_TYPES.has(mime)
      ? `${refusal}: the host serves it as ${mime}, which a browser would run`
      : refusal

/**
 * A fetched file's type: the host's when it names an upload kind; refused as the host declared it
 * when that is a type a browser runs (HTML, SVG, XML, script), whatever the filename ends in; else
 * read off the name, as a picker reads it.
 */
function fetchedType(declared: string | null, named: string): string {
  const bare = declared?.split(';')[0]?.trim().toLowerCase() ?? ''
  if (bare && (uploadKindOf(bare) || RUNNABLE_TYPES.has(bare))) return bare
  return fileTypeOf(named) ?? bare
}

/** The URL to PUT one file to: issued here, taken by the studio's route (`answerUpload`). */
function uploadUrl(session: McpSession): Capability[] {
  const { uploads } = session
  if (!uploads || !session.files) return []
  return [
    capability(
      'file_upload_url',
      FILE_UPLOAD_URL_DESCRIPTION,
      {
        filename: z.string().min(1).max(200),
        bytes: z.number().int().positive().describe('The file’s exact size in bytes'),
        contentType: z.string().min(1).max(120).optional(),
      },
      false,
      ({ filename, bytes, contentType }) => {
        const mime = contentType ?? fileTypeOf(filename)
        if (!mime) {
          throw new Error(`what kind of file is "${filename}"? Pass contentType, like image/png`)
        }
        const refusal = uploadRefusal(mime, bytes, undefined, uploadCaps(codeLimits(session.ws)))
        if (refusal) throw new Error(refusalWords(mime, refusal))
        const ticket = issueTicket({
          workspaceId: session.ws.id,
          actorId: session.member.id,
          name: uploadName(filename),
          mime,
          bytes,
        })
        const url = uploads.url(ticket.token)
        return {
          url,
          method: 'PUT',
          key: `file:${ticket.fileId}`,
          expiresAt: new Date(ticket.expiresAt).toISOString(),
          curl: `curl --fail-with-body -T '${filename.replace(/'/g, `'\\''`)}' '${url}'`,
        }
      },
    ),
  ]
}

/**
 * A file the server fetches itself: the agent's call is the consent for that one host, as a
 * person's press is for a bookmark's preview — tsuru keeps every other refusal, and the ledger
 * keeps the request either way (C3: the network is reached here, never in service).
 */
function uploadFrom(session: McpSession, fileUrl?: (id: string) => string): Capability[] {
  const { files, ws } = session
  if (!files) return []
  return [
    capability(
      'file_upload_from',
      FILE_UPLOAD_FROM_DESCRIPTION,
      {
        url: z.url({ protocol: /^https$/ }).max(2048),
        filename: z.string().min(1).max(200).optional(),
      },
      false,
      async ({ url, filename }) => {
        const entry = {
          origin: 'agent' as const,
          actorId: session.member.id,
          subject: 'file_upload_from',
          input: { url },
        }
        const caps = uploadCaps(codeLimits(ws))
        let stored: Awaited<ReturnType<typeof files.put>>
        let source: string
        try {
          const fetched = await fetchFile(url, {
            allowPrivate: privateNetworkAllowed(ws),
            maxBytes: largestUpload(caps),
          })
          const named = filename ?? fetched.filename ?? 'file'
          const mime = fetchedType(fetched.contentType, named)
          const refusal = uploadRefusal(mime, fetched.bytes.byteLength, undefined, caps)
          if (refusal) throw new Error(refusalWords(mime, refusal))
          stored = await files.put({ name: uploadName(named), mime, bytes: fetched.bytes })
          source = fetched.url
        } catch (cause) {
          // Every way it fails is a ledger row: a refusal, a name that will not resolve, a host too
          // slow, a store that would not keep it.
          const detail = failureWords(cause)
          recordCapability(ws, { ...entry, decision: 'denied', detail })
          throw new Error(detail)
        }
        recordCapability(ws, { ...entry, decision: 'auto' })
        return {
          key: `file:${stored.id}`,
          ...stored,
          source,
          ...(fileUrl ? { url: fileUrl(stored.id) } : {}),
        }
      },
    ),
  ]
}

/** Uploads that never pass through the agent's context (D135). */
export function uploadCapabilities(
  session: McpSession,
  fileUrl?: (id: string) => string,
): Capability[] {
  return [...uploadUrl(session), ...uploadFrom(session, fileUrl)]
}
