import { createContext, useContext } from 'react'

/** Whether a Step is drawn by Steps (numbered) or by a Timeline (its own marker). */
export const StepsContext = createContext(false)

export function useInSteps(): boolean {
  return useContext(StepsContext)
}
