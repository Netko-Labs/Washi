import {
  CHOICE_COLUMN_TYPES as CHOICE,
  COMPUTED_COLUMN_TYPES as COMPUTED,
  STATUS_GROUP_KEYS as GROUPS,
} from './constants'
import type {
  Cell,
  ChangedSpec,
  ColumnChange,
  ColumnSpec,
  OptionChange,
  RecordData,
  StatusGroups,
  TableSpec,
} from './types'
import { statusOptions } from './validate'

const refuse = (error: string): ChangedSpec => ({ ok: false, error })

/** Notion's title property: the first text column names the row. */
export function titleColumnOf(spec: TableSpec): ColumnSpec | undefined {
  return spec.columns.find((column) => column.type === 'text')
}

function optionsOf(column: ColumnSpec): string[] {
  return column.type === 'status' ? statusOptions(column) : (column.options ?? [])
}

function renameIn(list: string[], from: string, to: string): string[] {
  return list.map((each) => (each === from ? to : each))
}

function changedGroups(groups: StatusGroups, change: OptionChange): StatusGroups | string {
  const { from, to } = change
  if (from !== undefined && to !== undefined) {
    return Object.fromEntries(
      GROUPS.map((group) => [group, renameIn(groups[group], from, to)]),
    ) as StatusGroups
  }
  if (to !== undefined) {
    const group = change.group ?? 'todo'
    return { ...groups, [group]: [...groups[group], to] }
  }
  const left = Object.fromEntries(
    GROUPS.map((group) => [group, groups[group].filter((each) => each !== from)]),
  ) as StatusGroups
  return left.todo.length && left.done.length
    ? left
    : 'A status keeps at least one to-do and one complete option.'
}

function changedOptions(column: ColumnSpec, change: OptionChange): ColumnSpec | string {
  if (!CHOICE.has(column.type)) return 'Only a select, multi-select or status has options.'
  const { from, to } = change
  const options = optionsOf(column)
  if (from !== undefined && !options.includes(from)) return `“${from}” is not an option.`
  if (to !== undefined && to !== from && options.includes(to))
    return `“${to}” is already an option.`
  if (from === to) return column
  if (column.type === 'status' && column.groups) {
    const groups = changedGroups(column.groups, change)
    return typeof groups === 'string' ? groups : { ...column, groups }
  }
  if (to !== undefined && from === undefined && options.length >= 64)
    return 'Keep it to 64 options.'
  const next =
    from !== undefined && to !== undefined
      ? renameIn(options, from, to)
      : to !== undefined
        ? [...options, to]
        : options.filter((each) => each !== from)
  return next.length ? { ...column, options: next } : 'A select keeps at least one option.'
}

/** The table's spec after one column-menu change; refused in words when it cannot be made. */
export function changedSpec(spec: TableSpec, change: ColumnChange): ChangedSpec {
  const column = spec.columns.find((each) => each.name === change.column)
  if (!column) return refuse(`“${change.column}” is not a property of ${spec.name}.`)
  const others = spec.columns.filter((each) => each !== column)
  switch (change.kind) {
    case 'rename':
      if (change.to === column.name) return { ok: true, spec }
      if (others.some((each) => each.name === change.to)) {
        return refuse(`“${change.to}” is already a property.`)
      }
      return {
        ok: true,
        spec: {
          ...spec,
          columns: spec.columns.map((each) =>
            each === column ? { ...column, name: change.to } : each,
          ),
        },
      }
    case 'remove':
      if (column === titleColumnOf(spec)) {
        return refuse('The title can’t be deleted — every row is named by it.')
      }
      return others.length
        ? { ok: true, spec: { ...spec, columns: others } }
        : refuse('A table keeps at least one property.')
    case 'option': {
      const next = changedOptions(column, change)
      if (typeof next === 'string') return refuse(next)
      if (next === column) return { ok: true, spec }
      return {
        ok: true,
        spec: { ...spec, columns: spec.columns.map((each) => (each === column ? next : each)) },
      }
    }
  }
}

const isEmpty = (cell: Cell | undefined) =>
  cell === undefined || cell === null || (Array.isArray(cell) && cell.length === 0)

function movedOption(cell: Cell | undefined, change: OptionChange): Cell | undefined {
  const { from, to } = change
  if (from === undefined || isEmpty(cell)) return undefined
  if (Array.isArray(cell)) {
    if (!cell.includes(from)) return undefined
    const kept = to === undefined ? cell.filter((each) => each !== from) : renameIn(cell, from, to)
    return kept.length ? [...new Set(kept)] : null
  }
  return cell === from ? (to ?? null) : undefined
}

/**
 * What one stored row must be patched with for the change to keep its values honest; null when
 * nothing moves. A computed column holds nothing, so nothing of it moves.
 */
export function rowPatch(
  column: ColumnSpec,
  change: ColumnChange,
  data: RecordData,
): RecordData | null {
  if (COMPUTED.has(column.type)) return null
  const cell = data[column.name]
  switch (change.kind) {
    case 'rename':
      return isEmpty(cell) || change.to === column.name
        ? null
        : { [change.to]: cell ?? null, [column.name]: null }
    case 'remove':
      return isEmpty(cell) ? null : { [column.name]: null }
    case 'option': {
      const moved = movedOption(cell, change)
      return moved === undefined ? null : { [column.name]: moved }
    }
  }
}
