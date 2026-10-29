import { TITLE_SEPARATOR, UNTITLED } from './constants'
import type { TitlePart } from './types'

/** `<place> · <context>` (D112). */
export function titleOf(parts: readonly TitlePart[]): string {
  return parts
    .filter((part): part is string => typeof part === 'string')
    .map((part) => part.trim() || UNTITLED)
    .join(TITLE_SEPARATOR)
}
