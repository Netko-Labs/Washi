import { definePlugin } from 'nitro'

/**
 * Nitro's `/assets/**` rule marks every answer immutable, a 404 too. Mid-rollout the old container
 * misses the new chunks, and a browser would keep that 404 for a year: a blank app.
 */
export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('response', (res, event) => {
    if (res.status >= 400 && new URL(event.req.url).pathname.startsWith('/assets/')) {
      res.headers.set('cache-control', 'no-store')
    }
  })
})
