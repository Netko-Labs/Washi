import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  openWorkspace,
  recordSpend,
  setAppMeta,
  spendForDay,
  type Workspace,
} from '@washi/repository'
import { AgentHost } from '../agents/host'
import { DAILY_CAP_USD_KEY, DAILY_TURN_CAP_KEY } from '../agents/lib'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

const host = () => new AgentHost(ws)

/** A safety stop, not a quota (Q25) — this is OSS and there is no pricing. */
describe('the daily circuit breaker', () => {
  test('a fresh workspace is open', () => {
    expect(host().breaker().kind).toBe('open')
  })

  test('spend accumulates across turns, which the old per-turn cap never did', () => {
    recordSpend(ws, 1.5)
    recordSpend(ws, 2.25)
    const spend = spendForDay(ws)
    expect(spend.costUsd).toBeCloseTo(3.75)
    expect(spend.turns).toBe(2)
  })

  test('it trips at the cap', () => {
    setAppMeta(ws, DAILY_CAP_USD_KEY, '3')
    recordSpend(ws, 3.5)
    const state = host().breaker()
    expect(state.kind).toBe('tripped')
    if (state.kind === 'tripped') {
      expect(state.capUsd).toBe(3)
      expect(state.costUsd).toBeCloseTo(3.5)
    }
  })

  test('the cap is per workspace, not a constant', () => {
    setAppMeta(ws, DAILY_CAP_USD_KEY, '100')
    recordSpend(ws, 40)
    expect(host().breaker().kind).toBe('open')
  })

  test('a nonsense cap falls back to the default rather than disabling the stop', () => {
    setAppMeta(ws, DAILY_CAP_USD_KEY, 'free money please')
    recordSpend(ws, 999)
    expect(host().breaker().kind).toBe('tripped')
  })

  test('Resume actually resumes — the button has to do something', () => {
    setAppMeta(ws, DAILY_CAP_USD_KEY, '1')
    recordSpend(ws, 5)
    const agent = host()
    expect(agent.breaker().kind).toBe('tripped')

    agent.resume()
    // Measured from the acknowledgement, not from zero. Clearing only the flag
    // would leave the cap comparison tripping on the same spend forever.
    expect(agent.breaker().kind).toBe('open')
    expect(agent.spend().paused).toBe(false)
    expect(agent.spend().costUsd).toBeCloseTo(5)
  })

  test('Resume grants exactly one more cap, not amnesty for the day', () => {
    setAppMeta(ws, DAILY_CAP_USD_KEY, '1')
    recordSpend(ws, 5)
    const agent = host()
    agent.resume()
    expect(agent.breaker().kind).toBe('open')

    recordSpend(ws, 1.2)
    expect(agent.breaker().kind).toBe('tripped')
  })

  test('an unpriced turn still counts — openrouter/auto publishes no price', () => {
    recordSpend(ws, null)
    recordSpend(ws, null)
    const spend = spendForDay(ws)
    // A turn nobody can price must not also be a turn nobody counts; that is
    // exactly the one the breaker would never see.
    expect(spend.turns).toBe(2)
    expect(spend.costUsd).toBe(0)
  })

  test('turns bound a workspace whose model has no price at all', () => {
    setAppMeta(ws, DAILY_TURN_CAP_KEY, '3')
    for (let i = 0; i < 3; i += 1) recordSpend(ws, null)
    // $0 spent, forever, so only the turn count can trip this.
    expect(host().breaker().kind).toBe('tripped')
  })

  test('a turn-cap trip says so, and Resume really reopens it', () => {
    setAppMeta(ws, DAILY_TURN_CAP_KEY, '3')
    for (let i = 0; i < 3; i += 1) recordSpend(ws, 0.1, { billing: 'plan' })
    const agent = host()
    const state = agent.breaker()
    expect(state.kind === 'tripped' && state.reason).toBe('turns')
    agent.resume()
    expect(agent.breaker().kind).toBe('open')
    for (let i = 0; i < 3; i += 1) recordSpend(ws, null)
    expect(agent.breaker().kind).toBe('tripped')
  })

  test('spend reports the cap alongside the total, so a client can show both', () => {
    setAppMeta(ws, DAILY_CAP_USD_KEY, '12')
    recordSpend(ws, 2)
    const report = host().spend()
    expect(report.capUsd).toBe(12)
    expect(report.costUsd).toBeCloseTo(2)
    expect(report.turns).toBe(1)
  })
})
