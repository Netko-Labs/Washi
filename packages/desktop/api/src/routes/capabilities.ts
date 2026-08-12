import type { AgentHost } from '@washi/desktop-service'
import { rpc } from 'mirinjs/rpc'

/** Sheet-facing capabilities: tsuru fetch + hanko actions, same gates as agents. */
export function capabilityRoutes(host: AgentHost) {
  return {
    fetchUrl: rpc.query(({ url }: { url: string }): Promise<string> => host.fetchForSheet(url)),
    runAction: rpc.mutation(async ({ action }: { action: { verb: string } }): Promise<void> => {
      await host.executeAction(action)
    }),
  }
}
