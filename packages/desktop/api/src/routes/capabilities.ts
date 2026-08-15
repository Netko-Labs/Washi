import type { AgentHost } from '@washi/desktop-service'
import { rpc } from 'mirinjs/rpc'

/**
 * Sheet-facing capabilities: tsuru fetch + hanko actions. Origin is stamped
 * here and never taken from the caller — a rendered sheet is a sheet, whatever
 * its WSX claims (spec §09 P4).
 */
export function capabilityRoutes(host: AgentHost) {
  return {
    fetchUrl: rpc.query(({ url }: { url: string }): Promise<string> => host.fetchForSheet(url)),
    runAction: rpc.mutation(async ({ action }: { action: { verb: string } }): Promise<void> => {
      await host.executeAction(action, 'sheet')
    }),
  }
}
