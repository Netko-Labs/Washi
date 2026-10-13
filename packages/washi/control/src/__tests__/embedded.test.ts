import { describe, expect, test } from 'bun:test'
import { createEmbeddedControlPlane } from '../lib/embedded'

const plane = createEmbeddedControlPlane({ workspaceId: 'default' })

/** Phase 7 is this file being enough. */
describe('the embedded control plane answers with constants', () => {
  test('there is nobody to authenticate', async () => {
    expect(await plane.authenticate(new Request('http://localhost'))).toBeNull()
  })

  test('its own workspace is allowed', async () => {
    expect(await plane.authorize(null, 'default')).toBe(true)
  })

  test('any other workspace id is not — a leaked id cannot reach another file', async () => {
    expect(await plane.authorize(null, 'someone-elses-org')).toBe(false)
  })

  test('it lists exactly one workspace', async () => {
    expect(await plane.listWorkspaces(null)).toEqual([
      { id: 'default', name: 'Personal workspace', role: 'owner' },
    ])
  })

  test('it serves no auth routes', async () => {
    expect(await plane.handle(new Request('http://localhost/api/auth/session'))).toBeNull()
  })

  test('it has no key store — the machine supplies its own key', () => {
    expect(plane.secrets).toBeUndefined()
  })
})
