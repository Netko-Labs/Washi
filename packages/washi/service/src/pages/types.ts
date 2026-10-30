import type { PagePackageSet } from '@washi/domain'

/** A page's sandbox budget, as the server sets it (D118). */
export interface SandboxBudget {
  deadlineMs: number
  memoryBytes: number
}

/** A page bundled for the reader's sandbox, or why not, in words. */
export type CompiledPage =
  | { ok: true; js: string; sandbox?: SandboxBudget; network?: string[] }
  | { ok: false; error: string }

/** How big a widget's bundle may be, and which hosts its frame may reach. */
export interface WidgetReach {
  maxKb: number
  network: string[]
}

/** Another page's source, if the reader may read it — what a `page:<id>` import resolves to. */
export type PageSource = (id: string) => string | null

/** Where a bundle runs: what starts it, what `washi` is there, how hard it is squeezed. */
export interface BundleTarget {
  entry: string
  washi: string
  /** React resolves only for `washi` itself, never for a page's own imports. */
  react: boolean
  minify: Bun.BuildConfig['minify']
  /** A Terminal's program (D119): Node's modules and its own `./x.json` resolve to the frame's. */
  node?: boolean
  /** Replaced as it bundles, beside `process.env.NODE_ENV`. */
  define?: Record<string, string>
  /** How `washi:self` reads: a page is TSX, a Terminal's program plain JS. */
  selfLoader?: 'js' | 'tsx'
  /** Why an import is refused there, in words. */
  refusal?: (path: string, set: PagePackageSet | null) => string
}
