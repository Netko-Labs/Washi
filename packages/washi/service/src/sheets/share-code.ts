import { redactForShare } from '@washi/paper/registry'
import type { Workspace } from '@washi/repository'
import { parse, serialize } from '@washi/wsx'
import { compilePage } from '../pages'
import type { CompiledPage } from '../pages/types'
import { codeLimits, pagePackagesOf } from '../server'
import { sharedSheet } from './share'

/**
 * The page a link draws, compiled for the visitor's sandbox (D125): always the server's own copy,
 * redacted as the link serves it — never source a visitor sends. A `page:` import resolves only to
 * another page this same link opens, redacted too; any other is "not a page you can read".
 */
export async function sharedCompile(
  ws: Workspace,
  token: string,
  page?: string,
): Promise<CompiledPage> {
  const { root, home, tree } = sharedSheet(ws, token, page)
  const opens = new Set([home.id, ...tree.map((entry) => entry.id)])
  const read = (id: string) => {
    if (!opens.has(id)) return null
    try {
      return serialize(redactForShare(parse(sharedSheet(ws, token, id).sheet.source)))
    } catch {
      return null
    }
  }
  return compilePage(serialize(redactForShare(root)), read, pagePackagesOf(ws), codeLimits(ws))
}
