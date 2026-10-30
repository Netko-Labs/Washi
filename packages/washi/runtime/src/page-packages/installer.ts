import type { PagePackage } from '@washi/domain'
import type { PagePackageRow } from '@washi/trpc'
import { installedPackage } from './disk'
import type { InstallState, PagePackageDeps, PagePackageInstaller } from './types'

const words = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).split('\n')[0] ?? 'it did not install'

/**
 * The server's page packages (D116): the admin's list lives in `instance_setting`, the files in
 * `<dataDir>/page-packages`. One bun at a time works the folder; a row says how its install went.
 */
export function createPagePackages(deps: PagePackageDeps): PagePackageInstaller {
  const states = new Map<string, InstallState>()
  let work: Promise<unknown> = Promise.resolve()
  let edits: Promise<unknown> = Promise.resolve()

  const queue = (job: () => Promise<void>) => {
    const next = work.then(job)
    work = next.catch(() => {})
    return next
  }
  const edit = (change: (packages: PagePackage[]) => PagePackage[]) => {
    const next = edits.then(() => deps.save(change(deps.listed())))
    edits = next.catch(() => {})
    return next
  }
  const current = (name: string, spec: string) =>
    deps.listed().find((each) => each.name === name && each.spec === spec)
  const settle = (name: string, spec: string, state: Omit<InstallState, 'spec'>) => {
    if (states.get(name)?.spec === spec) states.set(name, { ...state, spec })
  }

  const install = ({ name, spec, version }: PagePackage) =>
    queue(async () => {
      if (!current(name, spec)) return
      try {
        const resolved = await deps.resolve(name, version ?? spec)
        if (resolved.hasInstallScript) {
          throw new Error(
            `${name}@${resolved.version} runs install scripts — page packages never do`,
          )
        }
        await deps.install(deps.dir, name, resolved.version)
        const installed = installedPackage(deps.dir, name)
        if (!installed?.isEsm) {
          await deps.uninstall(deps.dir, name).catch(() => {})
          throw new Error(`${name} has no ES module entry — page code bundles ES modules only`)
        }
        if (!current(name, spec)) return
        await edit((packages) =>
          packages.map((each) =>
            each.name === name && each.spec === spec
              ? { ...each, version: installed.version }
              : each,
          ),
        )
        settle(name, spec, { status: 'ready', bytes: installed.bytes, error: null })
      } catch (error) {
        settle(name, spec, { status: 'failed', bytes: null, error: words(error) })
      }
    })

  return {
    list(): PagePackageRow[] {
      return deps.listed().map((each) => {
        const state = states.get(each.name)
        return {
          ...each,
          status: state?.status ?? 'installing',
          bytes: state?.bytes ?? null,
          error: state?.error ?? null,
        }
      })
    },

    async add({ name, spec }) {
      await edit((packages) => [
        ...packages.filter((each) => each.name !== name),
        { name, spec, version: null },
      ])
      states.set(name, { spec, status: 'installing', bytes: null, error: null })
      void install({ name, spec, version: null })
      return { name, spec, version: null, status: 'installing', bytes: null, error: null }
    },

    async remove(name) {
      await edit((packages) => packages.filter((each) => each.name !== name))
      states.delete(name)
      void queue(() => deps.uninstall(deps.dir, name)).catch(() => {})
    },

    async restore() {
      // Synchronous up to the first install, so a page served right after boot already compiles.
      const missing: PagePackage[] = []
      for (const each of deps.listed()) {
        const installed = installedPackage(deps.dir, each.name)
        if (each.version && installed?.version === each.version && installed.isEsm) {
          states.set(each.name, {
            spec: each.spec,
            status: 'ready',
            bytes: installed.bytes,
            error: null,
          })
        } else {
          states.set(each.name, { spec: each.spec, status: 'installing', bytes: null, error: null })
          missing.push(each)
        }
      }
      await Promise.all(missing.map(install))
    },

    ready() {
      const packages = deps
        .listed()
        .flatMap(({ name, spec, version }) =>
          version && states.get(name)?.status === 'ready' && states.get(name)?.spec === spec
            ? [{ name, version }]
            : [],
        )
      return { dir: deps.dir, packages }
    },

    async idle() {
      await work
      await edits
    },
  }
}
