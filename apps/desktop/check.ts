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
  await app.click('[aria-label="Open Kyoto in October"]')
  await app.expectText('Arashiyama')
  await app.screenshot('showcase-playbook')

  app.step('creating a sheet adds it to the sidebar and opens it')
  await app.click('[aria-label="New sheet"]')
  await app.expectText(
    'Blank canvas. Ask the agent to design this page, or describe what it should hold.',
  )

  app.step('inbox and daily note open as tabs')
  await app.click('text=Inbox')
  await app.expectText('Everything Washi wants you to look at, in one queue.')
  await app.click('text=Daily note')
  await app.expectText('12-day streak')
  await app.screenshot('rev2-daily')

  app.step('the command palette searches pages')
  await app.click('[aria-label="Search (⌘K)"]')
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

  app.step('the agent FAB opens the popover with composer and status header')
  await app.click('[data-agent-fab]')
  await app.waitFor('[data-agent-panel]')
  await app.expectText('watching this vault')
  await app.waitFor('[data-inference]', { timeoutMs: 10_000 })

  app.step('clearing the conversation starts a fresh session with the empty chat')
  await app.click('[aria-label="Clear conversation"]')
  await app.waitUntil(async () => {
    const snapshot = await app.snapshot()
    return snapshot.includes('Session ')
  }, 'the new session never appeared in the header')
  await app.expectText('Ask me anything')
  await app.screenshot('m2-agent-panel')

  app.step('the dashboard reports real turns, not invented ones')
  await app.click('text=Dashboard')
  await app.expectText('Saved by your plan')
  await app.expectText('Turns today')
  await app.screenshot('mlp-dashboard')

  app.step('the Agents tab says who Washi thinks with')
  await app.click('text=Local account')
  await app.click('text=Settings')
  await app.click('text=Agents')
  await app.expectText('Claude Code on this computer', { timeoutMs: 10_000 })
  await app.expectText('Saved by your Claude plan')
  await app.expectText('Claude Code model')
  await app.expectText('Add a routine')
  await app.screenshot('mlp-agents-tab')

  app.step('the transport carried every call without an error')
  // mirin's rpc.error no longer exists — the renderer is an http client now, so a
  // failed procedure surfaces as a renderer exception or a console error instead.
  const failed = await app.logs({ type: ['renderer.error', 'renderer.exception'] })
  app.assert(
    failed.length === 0,
    `${failed.length} renderer error(s): ${failed.map((event) => event.msg).join('; ')}`,
  )

  const exposedAfter = (await app.exposed()) as { store?: { server?: string } }
  app.assert(
    typeof exposedAfter.store?.server === 'string' &&
      exposedAfter.store.server.startsWith('http://127.0.0.1:'),
    `expected a loopback server origin, saw ${exposedAfter.store?.server}`,
  )
})
