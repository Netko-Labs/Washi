import { tableLabel } from '@washi/paper'
import type {
  DataOption,
  KindOption,
  PageRef,
  SlashOption,
  SlashSources,
  SlashStep,
  TableRef,
} from '../types'
import { KIND_OPTIONS, SLASH_GROUP_ORDER, SLASH_STEPS, STEP_PAGE_MATCHES } from '../values'
import {
  blockOptions,
  databaseOptions,
  linkOptions,
  pageLinks,
  starterOptions,
  uploadOptions,
} from './slash-options'

export function kindMatches(query: string): KindOption[] {
  const needle = query.trim().toLowerCase()
  return KIND_OPTIONS.filter((option) => option.label.toLowerCase().includes(needle))
}

function tableStep(step: SlashStep, needle: string, tables: TableRef[]): DataOption[] {
  const { group } = SLASH_STEPS[step]
  return tables
    .filter((table) => `${tableLabel(table.name)} ${table.name}`.toLowerCase().includes(needle))
    .flatMap((table): DataOption[] => {
      const base = {
        type: 'data' as const,
        group,
        label: tableLabel(table.name),
        hint: table.name,
      }
      if (step === 'view') {
        return [
          {
            ...base,
            key: `view:${table.name}`,
            pick: { kind: 'view', table: table.name },
          },
        ]
      }
      if (step === 'automation') {
        return [
          {
            ...base,
            key: `automation:${table.name}`,
            pick: { kind: 'automation', table: table.name },
          },
        ]
      }
      if (!table.done) return []
      return [
        {
          ...base,
          key: `progress:${table.name}`,
          pick: { kind: 'progress', table },
        },
      ]
    })
}

function pageStep(
  step: SlashStep,
  needle: string,
  pages: PageRef[],
  selfId: string | null,
): DataOption[] {
  const { group } = SLASH_STEPS[step]
  return pages
    .filter((page) => page.id !== selfId || step === 'link')
    .filter((page) => (page.title || 'Untitled').toLowerCase().includes(needle))
    .slice(0, STEP_PAGE_MATCHES)
    .map((page) => ({
      type: 'data',
      group,
      key: `${step}:${page.id}`,
      label: page.title || 'Untitled',
      hint: step === 'include' ? 'Include' : 'Link',
      pick:
        step === 'include' ? { kind: 'include', sheet: page.id } : { kind: 'link', sheet: page.id },
    }))
}

/**
 * What `/` offers for `query`, in its groups' order. A step lists the tables or pages it drops a
 * block over instead; typing filters those.
 */
export function slashMatches(query: string, from: SlashSources = {}): SlashOption[] {
  const { tables = [], pages = [], isNested = false, step = null, selfId = null } = from
  const needle = query.trim().toLowerCase()
  if (step === 'link' || step === 'include') return pageStep(step, needle, pages, selfId)
  if (step) return tableStep(step, needle, tables)
  const options: SlashOption[] = [
    ...kindMatches(query).map((option) => ({
      type: 'text' as const,
      group: 'basic' as const,
      ...option,
    })),
    ...linkOptions(query),
    ...uploadOptions(needle),
    ...databaseOptions(query, tables),
    ...blockOptions(needle, isNested),
    ...starterOptions(needle),
    ...pageLinks(needle, pages),
  ]
  return SLASH_GROUP_ORDER.flatMap((group) => options.filter((option) => option.group === group))
}
