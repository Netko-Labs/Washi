import type { Workspace } from '@washi/repository'
import { evaluateExpr, parseExpr, type Row } from '@washi/wsx'
import { runQuery } from '../tables/service'
import { ROWS_READ } from './values'

/**
 * A page's `expr` worked out as a reader would see it — `count(backlog, status != 'Done')` reads
 * 34 — over each table's rows, read once per digest. Anything that needs the page's state, a
 * press or more than the rows read answers null, and the expr is shown as written.
 */
export function exprEvaluator(ws: Workspace): (expr: string) => string | null {
  const read = new Map<string, Row[] | undefined>()
  const rows = (table: string) => {
    if (!read.has(table)) {
      try {
        const { rows: found } = runQuery(ws, { table, limit: ROWS_READ })
        read.set(table, found.length < ROWS_READ ? (found as Row[]) : undefined)
      } catch {
        read.set(table, undefined)
      }
    }
    return read.get(table)
  }
  return (expr) => {
    try {
      const value = evaluateExpr(parseExpr(expr), { state: {}, args: {}, rows, now: Date.now() })
      if (value === null || typeof value === 'object') return null
      return typeof value === 'number' ? String(Math.round(value * 100) / 100) : String(value)
    } catch {
      return null
    }
  }
}
