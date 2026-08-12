/**
 * `mirin check` scenario for Washi's core flows.
 * Run: `bun run --cwd apps/desktop check`
 */

import { type CheckDriver, defineCheck } from 'mirinjs/check'

export default defineCheck(async (app: CheckDriver) => {
  app.step('the app boots and renders the welcome sheet')
  await app.expectText('Welcome to Washi', { timeoutMs: 10_000 })
  await app.click('text=Welcome to Washi')
  await app.expectText('Nothing in it can execute.')

  app.step('creating a sheet adds it to the sidebar and opens it')
  await app.click('[aria-label="New sheet"]')
  await app.expectText('Ask an agent to fill this in, or start writing.')

  app.step('search finds sheets by body text')
  await app.type('execute', { selector: 'input[placeholder="Search sheets"]' })
  await app.waitUntil(async () => {
    const snapshot = await app.snapshot()
    return snapshot.includes('…') || snapshot.includes('Welcome to Washi')
  }, 'search never returned the welcome sheet')
  await app.screenshot('m1-search')

  app.step('the main process store is legible to agents')
  const exposed = (await app.exposed()) as { store?: { sheets: number } }
  app.assert((exposed.store?.sheets ?? 0) >= 2, `expected ≥2 sheets, saw ${exposed.store?.sheets}`)

  app.step('the agent panel renders with composer and session picker')
  await app.waitFor('[data-agent-panel]')
  await app.expectText('Ask the agent')

  app.step('creating an agent session populates the picker and empty transcript')
  await app.click('[aria-label="New session"]')
  await app.waitUntil(async () => {
    const snapshot = await app.snapshot()
    return snapshot.includes('Session ')
  }, 'the new session never appeared in the picker')
  await app.expectText('create or edit sheets')
  await app.screenshot('m2-agent-panel')

  app.step('no RPC call failed along the way')
  const failed = await app.logs({ type: ['rpc.error'] })
  app.assert(
    failed.length === 0,
    `${failed.length} RPC call(s) failed: ${failed.map((event) => event.msg).join('; ')}`,
  )
})
