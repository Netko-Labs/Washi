import type { Workspace } from '@washi/repository'
import { pagePackagesOf } from '../server'
import { SYSTEM_INSTRUCTIONS } from './lib'

/** Washi's instructions as this turn starts: the server's page packages (D116) are read fresh. */
export function instructionsFor(ws: Workspace): string {
  const packages = pagePackagesOf(ws)?.packages ?? []
  if (packages.length === 0) return SYSTEM_INSTRUCTIONS
  const listed = packages.map(({ name, version }) => `${name}@${version}`).join(', ')
  return `${SYSTEM_INSTRUCTIONS}\nThis server also lets page code and widgets import these npm packages: ${listed}. Use one only when Washi's own libraries fall short.`
}
