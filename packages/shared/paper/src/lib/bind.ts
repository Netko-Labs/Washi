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

/** Params that read state take its value; an unset one is left out, so its rollup filter drops. */
function resolveParams(
  params: BindQuery['params'],
  values: Record<string, SheetStateValue>,
): InkQuery['params'] {
  if (!params) return undefined
  const resolved: NonNullable<InkQuery['params']> = {}
  for (const [name, value] of Object.entries(params)) {
    const read = value !== null && typeof value === 'object' ? values[value.state] : value
    if (read !== undefined && read !== null && read !== '') resolved[name] = read
  }
  return resolved
}

export function resolveQuery(query: BindQuery, values: Record<string, SheetStateValue>): InkQuery {
  return {
    ...query,
    where: resolveFilters(query.where, values),
    params: resolveParams(query.params, values),
  }
}

export function resolveHistory(
  query: BindHistoryQuery,
  values: Record<string, SheetStateValue>,
): HistoryQuery {
  return { ...query, where: resolveFilters(query.where, values) }
}
