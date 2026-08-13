import { createContext, type ReactNode, useContext, useState } from 'react'

export type SheetStateValue = string | number | boolean | null

/**
 * The declarative answer to "react hooks" (spec Q11): a validated key/value
 * store per rendered sheet. Controls write to it, <Show> reads from it —
 * hook-shaped interactivity with zero executable content in the sheet.
 */
interface SheetStateContextValue {
  values: Record<string, SheetStateValue>
  set: (key: string, value: SheetStateValue) => void
}

const SheetStateContext = createContext<SheetStateContextValue>({
  values: {},
  set: () => {},
})

export function SheetStateProvider({
  initial,
  children,
}: {
  initial: Record<string, SheetStateValue>
  children: ReactNode
}) {
  const [values, setValues] = useState(initial)
  return (
    <SheetStateContext.Provider
      value={{
        values,
        set: (key, value) => setValues((previous) => ({ ...previous, [key]: value })),
      }}
    >
      {children}
    </SheetStateContext.Provider>
  )
}

export function useSheetState(): SheetStateContextValue {
  return useContext(SheetStateContext)
}
