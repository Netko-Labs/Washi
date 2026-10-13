import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ControlPlane } from '@washi/trpc'
import { liveWorkspaceIds } from '../clock'

let dir = ''
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
})

const controlKnowing = (ids: string[]) => ({
  control: { workspaceIds: async () => ids } as unknown as ControlPlane,
})

describe('the routine clock only opens workspaces that exist', () => {
  test('a workspace must be known to the control plane and have a file', async () => {
    dir = mkdtempSync(join(tmpdir(), 'washi-clock-'))
    writeFileSync(join(dir, 'org_live.db'), '')
    writeFileSync(join(dir, 'org_deleted.db'), '')
    writeFileSync(join(dir, 'stray.db'), '')
    const ids = await liveWorkspaceIds(controlKnowing(['org_live', 'org_never_opened']), dir)
    expect(ids).toEqual(['org_live'])
  })

  test('no default workspace is conjured on a hosted server', async () => {
    dir = mkdtempSync(join(tmpdir(), 'washi-clock-'))
    expect(await liveWorkspaceIds(controlKnowing(['org_a']), dir)).toEqual([])
  })
})
