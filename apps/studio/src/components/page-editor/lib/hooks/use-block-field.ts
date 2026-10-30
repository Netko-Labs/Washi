import { useRef } from 'react'
import type { TextBlock } from '../types'
import { useAutoSize } from './use-auto-size'
import { useFocusRequest } from './use-focus-request'

/** A block's field: as tall as its text, and focused when the editor asks for the caret there. */
export function useBlockField(block: TextBlock) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useFocusRequest(block.id, ref)
  useAutoSize(ref, block.text)
  return ref
}
