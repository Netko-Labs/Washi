import { closeAllPeers } from '@washi/trpc'
import { definePlugin } from 'nitro'
import { washiRuntime } from '../runtime'

/**
 * Boots at start, not on the first request: the routine clock must tick on a server nobody has
 * visited yet. On SIGTERM sockets close with 1001 first; the runtime closes once Nitro has.
 */
export default definePlugin((nitroApp) => {
  const booting = washiRuntime().then((booted) => {
    console.log(`[washi] ${booted.runtime.mode} studio — workspaces in ${booted.dataDir}`)
    return booted
  })

  const drain = () => closeAllPeers(1001, 'server shutting down')
  process.once('SIGTERM', drain)
  process.once('SIGINT', drain)

  nitroApp.hooks.hook('close', async () => {
    await (await booting).stop()
  })
})
