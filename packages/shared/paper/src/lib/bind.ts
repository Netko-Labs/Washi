import type { Filter, HistoryQuery, InkQuery } from '@washi/ink'
import type { BindFilter, BindHistoryQuery, BindQuery } from '../registry'
import type { SheetStateValue } from '../state'
import type { ActionRef } from './types'

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

const isStateRef = (value: unknown): value is { state: string } =>
  value !== null &&
  typeof value === 'object' &&
  typeof (value as { state?: unknown }).state === 'string'

/** An action's `params` read page state like a query's (D76): `table.copy` into the picked month. */
export function resolveActionParams(
  action: ActionRef,
  values: Record<string, SheetStateValue>,
): ActionRef {
  const { params } = action
  if (params === null || typeof params !== 'object' || Array.isArray(params)) return action
  const resolved: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(params)) {
    const read = isStateRef(value) ? values[value.state] : value
    if (read !== undefined && read !== null && read !== '') resolved[name] = read
  }
  return { ...action, params: resolved }
}
