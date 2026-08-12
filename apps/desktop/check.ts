/**
 * `mirin check` scenario for Washi's core flows.
 * Run: `bun run --cwd apps/desktop check`
 */

import { type CheckDriver, defineCheck } from 'mirinjs/check'

export default defineCheck(async (app: CheckDriver) => {
  app.step('the app boots and the renderer connects to the main process')
  await app.expectText('washi。')
  await app.waitUntil(async () => {
    const snapshot = await app.snapshot()
    return snapshot.includes('main process connected')
  }, 'the ping RPC never round-tripped')

  app.step('no RPC call failed during boot')
  const failed = await app.logs({ type: ['rpc.error'] })
  app.assert(failed.length === 0, `${failed.length} RPC call(s) failed`)
})
