import { createContext, type ReactNode, useContext } from 'react'
import { useDataTables } from './lib/hooks/use-data-tables'
import type { DataContextValue } from './lib/types'

const DataContext = createContext<DataContextValue>({ tables: {}, version: 0, refresh: () => {} })

export function DataProvider({ tables, children }: { tables: string[]; children: ReactNode }) {
  const value = useDataTables(tables)
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  return useContext(DataContext)
}
