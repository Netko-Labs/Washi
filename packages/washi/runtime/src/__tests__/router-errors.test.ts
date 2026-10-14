import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { TRPCError } from '@trpc/server'
import { createEmbeddedControlPlane } from '@washi/control/embedded'
import { appRouter, createContext } from '@washi/trpc'
import { startRuntime } from '../boot'
import type { BootedRuntime } from '../types'

let dir = ''
let booted: BootedRuntime | null = null
afterEach(async () => {
  await booted?.stop()
  booted = null
  if (dir) rmSync(dir, { recursive: true, force: true })
})

const caller = () => {
  dir = mkdtempSync(join(tmpdir(), 'washi-router-'))
  booted = startRuntime(
    {
      mode: 'embedded',
      control: createEmbeddedControlPlane({ workspaceId: 'default' }),
      dataDir: dir,
    },
    [],
    false,
  )
  return appRouter.createCaller(createContext(booted.runtime))
}

describe('a page the validator refuses is a 400, not a 500', () => {
  test('invalid WSX on create', async () => {
    const error = await caller()
      .sheets.create({ write: { title: 'x', source: '<Sheet title="x"><Row gap="md" /></Sheet>' } })
      .catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(TRPCError)
    expect((error as TRPCError).code).toBe('BAD_REQUEST')
    expect((error as TRPCError).message).toContain('gap')
  })

  test('a valid page still saves', async () => {
    const sheet = await caller().sheets.create({
      write: { title: 'ok', source: '<Sheet title="ok"><Text>hi</Text></Sheet>' },
    })
    expect(sheet.title).toBe('ok')
  })
})
