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
  await app.expectText('watching this workspace')
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
  // "Saved by your plan" only once a plan turn saved something; a fresh profile has spent nothing.
  await app.expectText('Turns today')
  await app.expectText('Spent today')
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
  // tRPC over mirin IPC: a failed procedure is a TRPCClientError in the renderer, so it shows up
  // as a renderer exception or console error — and an IPC fault as an rpc.error.
  const failed = await app.logs({ type: ['renderer.error', 'renderer.exception', 'rpc.error'] })
  app.assert(
    failed.length === 0,
    `${failed.length} error(s): ${failed.map((event) => event.msg).join('; ')}`,
  )

  const exposedAfter = (await app.exposed()) as { store?: { workspace?: string; sheets?: number } }
  app.assert(
    exposedAfter.store?.workspace === 'default' && (exposedAfter.store.sheets ?? 0) > 0,
    `expected the embedded workspace with its showcase, saw ${JSON.stringify(exposedAfter.store)}`,
  )
})
