import { uploadCaps, uploadRefusal } from '@washi/domain'
import { codeLimits } from '@washi/service'
import { takeTicket } from './tickets'
import type { OpenUploads } from './types'

const refuse = (status: number, error: string) => Response.json({ error }, { status })

/** The body, read in chunks and stopped one byte past what the ticket promised. */
async function bodyOf(request: Request, promised: number): Promise<Uint8Array | null> {
  const reader = request.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let received = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > promised) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  return new Uint8Array(Buffer.concat(chunks))
}

/**
 * A PUT of a ticket's bytes (D135): the ticket is the whole permission — made for one member's
 * agent, one workspace, one file of one size, for ten minutes, once. The bytes land as that file,
 * under the rules and caps an upload meets anywhere, re-read now in case the server changed them.
 */
export async function answerUpload(
  request: Request,
  token: string,
  open: OpenUploads,
): Promise<Response> {
  const ticket = takeTicket(token)
  if (!ticket) {
    return refuse(
      404,
      'this upload URL was used or has expired — ask file_upload_url for a new one',
    )
  }
  const declared = request.headers.get('content-length')
  if (declared !== null && Number(declared) !== ticket.bytes) {
    return refuse(400, `this URL takes exactly ${ticket.bytes} bytes; the request says ${declared}`)
  }
  const opened = await open(ticket.workspaceId)
  if (!opened) return refuse(404, 'that workspace is gone')
  const refusal = uploadRefusal(
    ticket.mime,
    ticket.bytes,
    undefined,
    uploadCaps(codeLimits(opened.ws)),
  )
  if (refusal) return refuse(413, refusal)
  const bytes = await bodyOf(request, ticket.bytes)
  if (!bytes || bytes.byteLength !== ticket.bytes) {
    return refuse(400, `this URL takes exactly ${ticket.bytes} bytes`)
  }
  const stored = await opened.files.put({
    id: ticket.fileId,
    name: ticket.name,
    mime: ticket.mime,
    bytes,
  })
  return Response.json({ key: `file:${stored.id}`, ...stored }, { status: 201 })
}
