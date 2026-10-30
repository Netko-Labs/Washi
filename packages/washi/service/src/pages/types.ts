/** A page bundled for the reader's sandbox, or why not, in words. */
export type CompiledPage = { ok: true; js: string } | { ok: false; error: string }

/** Another page's source, if the reader may read it — what a `page:<id>` import resolves to. */
export type PageSource = (id: string) => string | null

/** Where a bundle runs: what starts it, what `washi` is there, how hard it is squeezed. */
export interface BundleTarget {
  entry: string
  washi: string
  /** React resolves only for `washi` itself, never for a page's own imports. */
  react: boolean
  minify: Bun.BuildConfig['minify']
}
