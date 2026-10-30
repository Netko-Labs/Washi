import { z } from 'zod'
import { EXACT_VERSION, NPM_REGISTRY, REGISTRY_TIMEOUT_MS } from './constants'
import type { ResolvedPackage } from './types'

const packumentSchema = z.object({
  'dist-tags': z.record(z.string(), z.string()).default({}),
  versions: z.record(z.string(), z.object({ hasInstallScript: z.boolean().optional() })),
})
type Packument = z.infer<typeof packumentSchema>

/** A tag, an exact version, else the highest version the range takes. */
export function pickVersion(packument: Packument, spec: string): string | null {
  const tagged = packument['dist-tags'][spec]
  if (tagged && packument.versions[tagged]) return tagged
  if (packument.versions[spec]) return spec
  const matching = Object.keys(packument.versions)
    .filter((version) => Bun.semver.satisfies(version, spec))
    .sort(Bun.semver.order)
  return matching.at(-1) ?? null
}

/** npm's abbreviated metadata: it says whether a version runs install scripts, before any download. */
export async function resolveFromRegistry(name: string, spec: string): Promise<ResolvedPackage> {
  const response = await fetch(`${NPM_REGISTRY}/${name.replace('/', '%2f')}`, {
    headers: { accept: 'application/vnd.npm.install-v1+json' },
    signal: AbortSignal.timeout(REGISTRY_TIMEOUT_MS),
  })
  if (response.status === 404) throw new Error(`${name} is not on npm`)
  if (!response.ok) throw new Error(`npm answered ${response.status} for ${name}`)
  const packument = packumentSchema.safeParse(await response.json())
  if (!packument.success) throw new Error(`npm's answer for ${name} did not read`)
  const version = pickVersion(packument.data, spec)
  if (!version || !EXACT_VERSION.test(version)) {
    throw new Error(`no version of ${name} matches ${spec}`)
  }
  return {
    version,
    hasInstallScript: packument.data.versions[version]?.hasInstallScript === true,
  }
}
