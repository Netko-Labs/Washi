import { useEffect, useState } from 'react'
import type { AnchoredAt } from '../types'
import { anchoredAt } from '../utils'

/** Keeps a fixed picker under what opened it while the page scrolls beneath both. */
export function useAnchored(anchor: HTMLElement): AnchoredAt {
  const [at, setAt] = useState(() => anchoredAt(anchor))
  useEffect(() => {
    const follow = () => setAt(anchoredAt(anchor))
    follow()
    document.addEventListener('scroll', follow, true)
    return () => document.removeEventListener('scroll', follow, true)
  }, [anchor])
  return at
}
