/**
 * `mirin check` scenario for Washi's core flows.
 * Run: `bun run --cwd apps/desktop check`
 */

import { type CheckDriver, defineCheck } from 'mirinjs/check'

export default defineCheck(async (app: CheckDriver) => {
  app.step('skip onboarding when this profile sees it')
  try {
    await app.waitFor('[data-onboarding]', { timeoutMs: 4000 })
    await app.click('text=Skip setup')
  } catch {
    // already onboarded in this dev profile
  }

  app.step('the app boots and renders the welcome sheet')
  await app.expectText('Welcome to Washi', { timeoutMs: 10_000 })
  await app.click('[aria-label="Open Welcome to Washi"]')
  await app.expectText('Notes agents can design')

  app.step('showcase sheets render their design directions')
  await app.click('[aria-label="Open Launch Dashboard"]')
  await app.expectText('sum(points)')
  await app.click('[aria-label="Open Release Playbook"]')
  await app.expectText('Freeze')
  await app.screenshot('showcase-playbook')

  app.step('creating a sheet adds it to the sidebar and opens it')
  await app.click('[aria-label="New sheet"]')
  await app.expectText('Ask an agent to fill this in, or start writing.')

  app.step('the command palette searches pages')
  await app.click('text=Search sheets')
  await app.waitFor('input[placeholder="Search pages, blocks and agents…"]')
  await app.type('welcome', { selector: 'input[placeholder="Search pages, blocks and agents…"]' })
  await app.waitUntil(async () => {
    const snapshot = await app.snapshot()
    return snapshot.includes('Welcome to Washi')
  }, 'the palette never listed the welcome sheet')
  await app.key('Escape')
  await app.screenshot('m1-search')

  app.step('the main process store is legible to agents')
  const exposed = (await app.exposed()) as { store?: { sheets: number } }
  app.assert((exposed.store?.sheets ?? 0) >= 2, `expected ≥2 sheets, saw ${exposed.store?.sheets}`)

  app.step('the agent panel renders with composer and status header')
  await app.waitFor('[data-agent-panel]')
  await app.expectText('watching this vault')

  app.step('creating an agent session populates the picker and empty transcript')
  await app.click('[aria-label="New session"]')
  await app.waitUntil(async () => {
    const snapshot = await app.snapshot()
    return snapshot.includes('Session ')
  }, 'the new session never appeared in the picker')
  await app.expectText('All caught up')
  await app.screenshot('m2-agent-panel')

  app.step('no RPC call failed along the way')
  const failed = await app.logs({ type: ['rpc.error'] })
  app.assert(
    failed.length === 0,
    `${failed.length} RPC call(s) failed: ${failed.map((event) => event.msg).join('; ')}`,
  )
})
