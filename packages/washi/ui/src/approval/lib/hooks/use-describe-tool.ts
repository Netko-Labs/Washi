import { useCallback } from 'react'
import { useSheetsStore } from '../../../stores'
import { describeTool } from '../utils'

/** `describeTool` with page ids resolved to the titles a person knows them by. */
export function useDescribeTool() {
  const sheets = useSheetsStore((state) => state.sheets)
  return useCallback(
    (name: string, input: unknown) =>
      describeTool(name, input, (id) => sheets.find((sheet) => sheet.id === id)?.title ?? null),
    [sheets],
  )
}
