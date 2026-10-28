import { useEffect, useState } from 'react'
import type { Copied } from '../types'
import { COPIED_MS } from '../values'

export function useCopied(): Copied {
  const [isCopied, setCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) return
    const timer = setTimeout(() => setCopied(false), COPIED_MS)
    return () => clearTimeout(timer)
  }, [isCopied])

  return {
    isCopied,
    copy: (text) => void navigator.clipboard.writeText(text).then(() => setCopied(true)),
  }
}
