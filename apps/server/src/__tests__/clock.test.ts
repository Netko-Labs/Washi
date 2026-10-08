import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { workspaceIds } from '../lib/clock'

let dir = ''
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
})

describe('the routine clock finds every workspace, opened or not', () => {
  test('each .db file is a workspace; the default is always included', () => {
    dir = mkdtempSync(join(tmpdir(), 'washi-clock-'))
    writeFileSync(join(dir, 'org_a.db'), '')
    writeFileSync(join(dir, 'org_b.db'), '')
    writeFileSync(join(dir, 'org_b.db-wal'), '')
    expect(workspaceIds(dir, 'default').sort()).toEqual(['default', 'org_a', 'org_b'])
  })

  test('a missing directory is not a crash', () => {
    expect(workspaceIds('/nonexistent/washi', 'default')).toEqual(['default'])
  })
})
