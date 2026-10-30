import { type UploadKind, uploadRefusal } from '@washi/domain'
import { hostUploadFile } from '@washi/ui'
import { api } from '@/integrations/trpc'
import { galleryNode, uploadNode } from './utils'

/** Stored in the workspace's files, checked first against the kind the menu offered. */
export async function uploaded(as: UploadKind, file: File | undefined) {
  if (!file) throw new Error('no file was picked')
  const caps = await api.files.caps.query().catch(() => undefined)
  const refused = uploadRefusal(file.type, file.size, as, caps)
  if (refused) throw new Error(refused)
  const send = hostUploadFile()
  if (!send) throw new Error('this app stores no files')
  const stored = await send(file)
  return uploadNode(as, { id: stored.id, name: file.name, size: file.size })
}

/** Every picture stored before any lands; one refused refuses the gallery, in its words. */
export async function uploadedGallery(files: File[]) {
  if (files.length === 0) throw new Error('no pictures were picked')
  const caps = await api.files.caps.query().catch(() => undefined)
  for (const file of files) {
    const refused = uploadRefusal(file.type, file.size, 'image', caps)
    if (refused) throw new Error(`${file.name}: ${refused}`)
  }
  const send = hostUploadFile()
  if (!send) throw new Error('this app stores no files')
  // All or none: if one fails, the ones that did land are taken back so nothing is left unused.
  const sent = await Promise.allSettled(files.map((file) => send(file)))
  const landed = sent.flatMap((each, at) =>
    each.status === 'fulfilled'
      ? [{ id: each.value.id, name: files[at]?.name ?? '', size: files[at]?.size ?? 0 }]
      : [],
  )
  const failed = sent.find((each) => each.status === 'rejected')
  if (failed) {
    await Promise.all(
      landed.map((each) => api.files.remove.mutate({ id: each.id }).catch(() => {})),
    )
    throw failed.reason instanceof Error ? failed.reason : new Error('a picture did not upload')
  }
  return galleryNode(landed)
}
