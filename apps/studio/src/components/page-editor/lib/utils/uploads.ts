import type { UploadKind } from '@washi/domain'
import type { WsxElement } from '@washi/wsx'
import { element } from '../convert'
import type { StoredUpload } from '../types'

/** The block an upload becomes: a picture, a player, or a document line. */
export function uploadNode(as: UploadKind, file: StoredUpload): WsxElement {
  const src = `file:${file.id}`
  if (as === 'image') return element('Figure', { src, alt: file.name }, [])
  if (as === 'video') return element('Video', { src, title: file.name }, [])
  if (as === 'audio') return element('Audio', { src, title: file.name }, [])
  return element('File', { src, name: file.name, bytes: file.size }, [])
}

/** A hidden picker, opened inside the press that chose it — browsers refuse one opened later. */
export function pickFiles(accept: string, isMany = false): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = isMany
    input.addEventListener('change', () => resolve([...(input.files ?? [])]), { once: true })
    input.addEventListener('cancel', () => resolve([]), { once: true })
    input.click()
  })
}

/** Pictures already stored, as a Gallery of Figures. */
export function galleryNode(files: StoredUpload[]): WsxElement {
  return element(
    'Gallery',
    {},
    files.map((file) => element('Figure', { src: `file:${file.id}`, alt: file.name }, [])),
  )
}
