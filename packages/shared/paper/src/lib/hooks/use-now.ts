import { createContext, useContext } from 'react'

/** `now()` is frozen per render pass; a Timer is the only thing that advances it. */
export const NowContext = createContext<number>(0)

export function useNow(): number {
  return useContext(NowContext)
}
