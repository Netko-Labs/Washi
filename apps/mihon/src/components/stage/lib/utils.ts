import { paperRegistry } from '@washi/paper/registry'
import { hasErrors, parse, validate, WsxParseError } from '@washi/wsx'
import type { CompiledPage } from './types'

/** The server's own gates, client-side: parse, then validate against the registry. */
export function compile(source: string): CompiledPage {
  try {
    const root = parse(source)
    const diagnostics = validate(root, paperRegistry)
    return { source, root, diagnostics, ok: !hasErrors(diagnostics) }
  } catch (cause) {
    const diagnostics =
      cause instanceof WsxParseError
        ? cause.diagnostics
        : [{ severity: 'error' as const, message: String(cause) }]
    return { source, root: null, diagnostics, ok: false }
  }
}
