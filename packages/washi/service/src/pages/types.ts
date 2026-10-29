/** A page bundled for the reader's sandbox, or why not, in words. */
export type CompiledPage = { ok: true; js: string } | { ok: false; error: string }

/** Another page's source, if the reader may read it — what a `page:<id>` import resolves to. */
export type PageSource = (id: string) => string | null
