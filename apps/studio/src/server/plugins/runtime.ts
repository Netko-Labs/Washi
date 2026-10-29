import { closeAllPeers } from '@washi/trpc'
import { definePlugin } from 'nitro'
import { SERVE_THROUGH_SHUTDOWN_MS } from '../constants'
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
  process.once('SIGINT', drain)
  // The server's own SIGTERM handler is installed once this module has run.
  setTimeout(() => serveThroughShutdown(booting, drain), 0)

  nitroApp.hooks.hook('close', async () => {
    await (await booting).stop()
  })
})

/**
 * srvx stops listening the moment SIGTERM lands, while the proxy still routes here until the
 * container exits — a 502 every deploy. So routines stop at once (the new container owns them),
 * requests are answered a while longer, then srvx closes as it would have.
 */
function serveThroughShutdown(booting: ReturnType<typeof washiRuntime>, drain: () => void) {
  const closers = process.listeners('SIGTERM')
  if (closers.length === 0) {
    process.once('SIGTERM', drain)
    return
  }
  for (const closer of closers) process.off('SIGTERM', closer)
  process.once('SIGTERM', () => {
    void booting.then((booted) => booted.stopClock())
    setTimeout(() => {
      drain()
      for (const closer of closers) closer('SIGTERM')
    }, SERVE_THROUGH_SHUTDOWN_MS)
  })
}
