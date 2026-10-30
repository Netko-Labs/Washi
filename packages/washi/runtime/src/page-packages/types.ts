import type { PagePackage, PagePackageSet } from '@washi/domain'
import type { PagePackageRow, PagePackageStore } from '@washi/trpc'

/** One version as npm describes it, enough to refuse it before anything is downloaded. */
export interface ResolvedPackage {
  version: string
  hasInstallScript: boolean
}

/** A package as it sits in the cache: what an install left, read back off disk. */
export interface InstalledPackage {
  version: string
  isEsm: boolean
  bytes: number
}

export interface PagePackageDeps {
  /** Holds `package.json` and the `node_modules` pages resolve from. */
  dir: string
  listed(): PagePackage[]
  save(packages: PagePackage[]): Promise<void>
  resolve(name: string, spec: string): Promise<ResolvedPackage>
  install(dir: string, name: string, version: string): Promise<void>
  uninstall(dir: string, name: string): Promise<void>
}

export interface PagePackageInstaller extends PagePackageStore {
  /** At boot: what is on disk is ready at once; anything missing installs again. */
  restore(): Promise<void>
  ready(): PagePackageSet
  /** Settles once every queued install and uninstall has. */
  idle(): Promise<void>
}

/** Held in memory beside the listed spec it is for, so a replaced package's old install is ignored. */
export type InstallState = Pick<PagePackageRow, 'status' | 'bytes' | 'error'> & { spec: string }
