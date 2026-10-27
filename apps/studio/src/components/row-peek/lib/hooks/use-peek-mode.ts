import { useState } from 'react'
import type { PeekMode } from '../types'
import { readPeekMode, writePeekMode } from '../utils'

/** Side or center, remembered for every row as Notion does. */
export function usePeekMode(): [PeekMode, (mode: PeekMode) => void] {
  const [mode, setMode] = useState<PeekMode>(readPeekMode)
  return [
    mode,
    (next) => {
      writePeekMode(next)
      setMode(next)
    },
  ]
}
