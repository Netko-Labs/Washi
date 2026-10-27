import type { CustomEmoji, CustomEmojiWrite } from '@washi/domain'
import {
  createCustomEmoji,
  customEmojiNamed,
  deleteCustomEmoji,
  type FileStore,
  getCustomEmoji,
  isUploadWorn,
  type Workspace,
} from '@washi/repository'

export class CustomEmojiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CustomEmojiError'
  }
}

export function addCustomEmoji(
  ws: Workspace,
  files: Pick<FileStore, 'info'>,
  write: CustomEmojiWrite,
  createdBy: string,
): CustomEmoji {
  if (!files.info(write.fileId)) throw new CustomEmojiError('that picture is not in this workspace')
  if (customEmojiNamed(ws, write.name)) {
    throw new CustomEmojiError(`there is already an emoji called :${write.name}:`)
  }
  return createCustomEmoji(ws, write, createdBy)
}

/**
 * Its adder or a steward removes an emoji. Answers the upload to free, if nothing else wears it —
 * a page still wearing it keeps the picture.
 */
export function removeCustomEmoji(
  ws: Workspace,
  id: string,
  remover: { id: string; mayRemoveAny: boolean },
): { freed: string | null } {
  const emoji = getCustomEmoji(ws, id)
  if (!emoji) throw new CustomEmojiError('no such emoji')
  if (emoji.createdBy !== remover.id && !remover.mayRemoveAny) {
    throw new CustomEmojiError('only the person who added an emoji, or an owner, can remove it')
  }
  deleteCustomEmoji(ws, id)
  return { freed: isUploadWorn(ws, emoji.fileId) ? null : emoji.fileId }
}
