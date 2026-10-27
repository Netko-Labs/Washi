import type { Filter, HistoryQuery, InkQuery } from '@washi/ink'
import type { BindFilter, BindHistoryQuery, BindQuery } from '../registry'
import type { SheetStateValue } from '../state'

/** A filter's `{ state }` read from the page; unset, empty or null state drops the filter ("All"). */
export function resolveFilters(
  where: BindFilter[] | undefined,
  values: Record<string, SheetStateValue>,
): Filter[] | undefined {
  if (!where) return undefined
  return where.flatMap((filter) => {
    const { value } = filter
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return [{ ...filter, value }]
    }
    const read = values[value.state]
    return read === undefined || read === null || read === '' ? [] : [{ ...filter, value: read }]
  })
}

export function resolveQuery(query: BindQuery, values: Record<string, SheetStateValue>): InkQuery {
  return { ...query, where: resolveFilters(query.where, values) }
}

export function resolveHistory(
  query: BindHistoryQuery,
  values: Record<string, SheetStateValue>,
): HistoryQuery {
  return { ...query, where: resolveFilters(query.where, values) }
}
