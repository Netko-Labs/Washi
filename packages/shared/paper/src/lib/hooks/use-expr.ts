import { type ExprValue, evaluateExpr, parseExpr } from '@washi/wsx'
import { useMemo } from 'react'
import { useData } from '../../data'
import { useRow, useSheetState } from '../../state'
import type { Row } from '../types'
import { useNow } from './use-now'

/**
 * Evaluates one page expression against declared state, the row in scope and
 * the tables the sheet prefetched. A bad expression renders as null, never throws
 * — validation already refused anything malformed before this ran.
 */
export function useExprValue(expr: string | undefined): ExprValue {
  const { values } = useSheetState()
  const { tables } = useData()
  const row = useRow()
  const now = useNow()

  return useMemo(() => {
    if (!expr) return null
    const args: Record<string, Row> = {}
    if (row) args.$row = row
    try {
      return evaluateExpr(parseExpr(expr), {
        state: values,
        args,
        rows: (table) => tables[table],
        scopeRows: undefined,
        now,
      })
    } catch {
      return null
    }
  }, [expr, values, tables, row, now])
}
