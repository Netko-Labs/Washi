import { useCallback, useRef } from 'react'
import { useSheetsStore } from '../../../stores'
import { describeTool } from '../utils'

/**
 * `describeTool` with page ids resolved to the titles a person knows them by. A title seen once
 * is kept, so a page Washi just trashed still reads by name.
 */
export function useDescribeTool() {
  const sheets = useSheetsStore((state) => state.sheets)
  const seen = useRef(new Map<string, string>())
  for (const sheet of sheets) seen.current.set(sheet.id, sheet.title)
  return useCallback(
    (name: string, input: unknown) =>
      describeTool(name, input, (id) => seen.current.get(id) ?? null),
    [sheets],
  )
}
