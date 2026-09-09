import { getSheet, listSheets } from '@washi/desktop-repository'
import { createSheetFromSource, removeSheet, updateSheetFromSource } from '@washi/desktop-service'
import { BOARD, HABITS, LIBRARY, SPLIT, WORKOUT } from './apps'
import { JIRA } from './jira'
import { DASHBOARD, ESSAY, POSTMORTEM, RECIPE, TRIP, WELCOME } from './notes'
import { primitivesSheet } from './primitives'
import { seedTables } from './tables'

/** Pre-0.4 showcase titles: their source is the old vocabulary and would render as Missing. */
const RETIRED = [
  'Release Playbook',
  'Ops Log',
  'System Map',
  'Neon Moodboard',
  'Interactive Kit',
  'Sprint board',
]

interface Seed {
  title: string
  icon: string
  source: string
}

function upsert(seed: Seed, byTitle: Map<string, string>): string {
  const existingId = byTitle.get(seed.title)
  if (!existingId) {
    const created = createSheetFromSource(seed)
    byTitle.set(seed.title, created.id)
    return created.id
  }
  if (getSheet(existingId)?.source !== seed.source) updateSheetFromSource(existingId, seed)
  return existingId
}

/** Showcase sheets track the build — idempotent by title, refreshed when their source evolves. */
export function seedShowcase(): void {
  seedTables()

  const byTitle = new Map(listSheets().map((sheet) => [sheet.title, sheet.id]))
  for (const title of RETIRED) {
    const id = byTitle.get(title)
    if (id) removeSheet(id)
  }

  const welcome = upsert({ title: 'Welcome to Washi', icon: 'sparkles', source: WELCOME }, byTitle)
  const seeds: Seed[] = [
    { title: 'Launch Dashboard', icon: 'rocket', source: DASHBOARD },
    { title: 'Kyoto in October', icon: 'plane', source: TRIP },
    { title: 'On Paper', icon: 'pen', source: ESSAY },
    { title: 'Postmortem: stored keys', icon: 'flag', source: POSTMORTEM },
    { title: 'Country loaf', icon: 'leaf', source: RECIPE },
    { title: 'WSX Primitives', icon: 'sparkles', source: primitivesSheet(welcome) },
    { title: 'Registry build', icon: 'kanban', source: BOARD },
    { title: 'WSX · Sprint 12', icon: 'kanban', source: JIRA },
    { title: 'Daily practice', icon: 'sun', source: HABITS },
    { title: 'Hakone trip', icon: 'money', source: SPLIT },
    { title: 'Session 34 · Pull', icon: 'target', source: WORKOUT },
    { title: 'Reading room', icon: 'book', source: LIBRARY },
  ]
  for (const seed of seeds) upsert(seed, byTitle)
}
