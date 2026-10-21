import type { Diagnostic, WsxElement } from '@washi/wsx'

export interface CompiledPage {
  source: string
  root: WsxElement | null
  diagnostics: Diagnostic[]
  ok: boolean
}
