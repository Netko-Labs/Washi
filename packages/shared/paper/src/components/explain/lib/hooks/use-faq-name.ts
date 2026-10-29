import { createContext, useContext } from 'react'

/** The `name` a Faq's details share, so the browser keeps one of them open. */
export const FaqContext = createContext<string | undefined>(undefined)

export function useFaqName(): string | undefined {
  return useContext(FaqContext)
}
