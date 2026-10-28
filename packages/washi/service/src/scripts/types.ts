/** TSX compiled for the sandbox, or why not, in words. */
export type CompiledScript = { ok: true; js: string } | { ok: false; error: string }

/** A `<Script>` found on a page: where it sits and the TSX it holds. */
export interface FoundScript {
  path: string
  source: string
}
