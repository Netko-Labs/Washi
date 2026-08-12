import { rpc } from 'mirinjs/rpc'

/**
 * tsuru (fetch) and hanko (actions) land with M2. The routes exist now so the
 * renderer's capability surface is stable; until then they refuse politely.
 */
export function capabilityRoutes() {
  return {
    fetchUrl: rpc.query(({ url }: { url: string }): Promise<string> => {
      throw new Error(`fetch is not available yet (requested ${new URL(url).hostname})`)
    }),
    runAction: rpc.mutation(({ action }: { action: { verb: string } }): void => {
      throw new Error(`unknown action verb "${action.verb}"`)
    }),
  }
}
