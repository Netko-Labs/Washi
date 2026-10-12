import { createContext, type ReactNode, useContext, useState } from 'react'
import type { Row } from './lib/types'

export type SheetStateValue = string | number | boolean | null

/**
 * Declared sheet state: controls write keys, `expr` reads them. `local` and
 * `stored` share one bag until stored persistence lands — both reset on reopen.
 */
interface SheetStateContextValue {
  values: Record<string, SheetStateValue>
  set: (key: string, value: SheetStateValue) => void
}

const SheetStateContext = createContext<SheetStateContextValue>({ values: {}, set: () => {} })

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

/** The row a <Repeat> put in scope — `$row.column` resolves against it. */
const RowContext = createContext<Row | null>(null)

export function RowProvider({ row, children }: { row: Row; children: ReactNode }) {
  return <RowContext.Provider value={row}>{children}</RowContext.Provider>
}

export function useRow(): Row | null {
  return useContext(RowContext)
}
