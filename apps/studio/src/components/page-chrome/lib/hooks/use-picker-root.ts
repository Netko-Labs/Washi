import { useRef } from 'react'
import { useDismiss } from '@/components/shared/dismiss'

/** A picker's root: a press outside it or Escape closes it. */
export function usePickerRoot(onClose: () => void) {
  const root = useRef<HTMLDivElement>(null)
  useDismiss(root, true, onClose)
  return root
}
