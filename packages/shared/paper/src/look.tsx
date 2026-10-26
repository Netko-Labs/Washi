import { createContext, useContext } from 'react'
import type { SheetLookHost, SheetLookProviderProps } from './lib/types'

const SheetLookContext = createContext<SheetLookHost>({})

export function SheetLookProvider({ value, children }: SheetLookProviderProps) {
  return <SheetLookContext.Provider value={value}>{children}</SheetLookContext.Provider>
}

export const useSheetLook = (): SheetLookHost => useContext(SheetLookContext)
