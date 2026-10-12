/**
 * The golden path, live: ask → approve at the desk → the page lands → the receipt
 * says who paid. Runs a real turn on this machine's Claude Code login, so it is
 * opt-in and never part of `check`.
 * Run: `bun run --cwd apps/desktop check:live`
 */

import { type CheckDriver, defineCheck } from 'mirinjs/check'

const TITLE = `Golden path ${new Date().toISOString().slice(11, 19)}`

export default defineCheck(async (app: CheckDriver) => {
  app.step('skip onboarding when this profile sees it')
  try {
    await app.waitFor('[data-onboarding]', { timeoutMs: 4000 })
    await app.click('text=Skip setup')
  } catch {
    // already onboarded in this dev profile
  }

  app.step('the composer names what it thinks with')
  await app.click('[data-agent-fab]')
  await app.waitFor('[data-agent-panel]')
  await app.waitFor('[data-inference]', { timeoutMs: 10_000 })
  await app.expectText('Claude Code')
  // A fresh conversation, so the receipt below is this run's and not the last one's.
  await app.click('[aria-label="Clear conversation"]')
  await app.expectText('Ask me anything')

  app.step('ask for a page')
  const composer = 'textarea[placeholder="Ask, or tell Washi what to write…"]'
  await app.type(
    `Create a sheet titled "${TITLE}" with a single <Title> that reads "${TITLE}". Run sheet_check first. Keep it minimal.`,
    { selector: composer },
  )
  await app.key('Enter')

  app.step('the write stops at the desk, and a person accepts it')
  await app.waitFor('[data-approval-bar]', { timeoutMs: 180_000 })
  await app.screenshot('live-approval')
  await app.click('text=Accept')

  app.step('the turn ends in a receipt billed to the plan')
  await app.waitUntil(
    async () => (await app.snapshot()).includes('on your Claude plan'),
    'no plan receipt arrived',
    { timeoutMs: 180_000 },
  )
  await app.screenshot('live-receipt')

  app.step('the page Washi made is the page that opens')
  await app.waitUntil(
    async () =>
      [
        ...((await app.evaluate<string[]>(
          "[...document.querySelectorAll('h1')].map((h) => h.textContent ?? '')",
        )) ?? []),
      ].some((text) => text.includes(TITLE)),
    'the new page never opened',
    { timeoutMs: 10_000 },
  )
  await app.screenshot('live-opened')
})
