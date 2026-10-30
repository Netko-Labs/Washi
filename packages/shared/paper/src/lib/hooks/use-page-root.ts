import type { WsxElement } from '@washi/wsx'
import { createContext, useContext } from 'react'

/** The page being drawn as written — its code included — for what compiles against it (a widget). */
export const PageRootContext = createContext<WsxElement | null>(null)

export function usePageRoot(): WsxElement | null {
  return useContext(PageRootContext)
}
