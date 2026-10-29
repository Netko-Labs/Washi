import { describe, expect, test } from 'bun:test'
import { serverPolicySchema } from '@washi/domain'
import {
  appRouter,
  type ControlPlane,
  createContext,
  createEventBus,
  createPresenceBoard,
  type InstanceStore,
  type ServerRuntime,
  type SignupMode,
} from '../index'

function runtimeWith(instance?: InstanceStore): ServerRuntime {
  const control: ControlPlane = {
    authenticate: async () => null,
    authorize: async () => true,
    listWorkspaces: async () => [],
    listMembers: async () => [],
    workspaceIds: async () => [],
    handle: async () => null,
    close: async () => {},
    instance,
  }
  return {
    mode: 'hosted',
    events: createEventBus(),
    resolve: () => {
      throw new Error('no workspace in this test')
    },
    control,
    defaultWorkspaceId: 'w1',
    presence: createPresenceBoard(() => {}),
  }
}

function store() {
  let signup: SignupMode = 'invite'
  let policy = serverPolicySchema.parse({})
  let key: { last4: string; provider: string; model: string | null } | null = null
  let searchKey: string | null = null
  const instance: InstanceStore = {
    isAdmin: async (id) => id === 'first',
    signup: async () => signup,
    setSignup: async (mode) => {
      signup = mode
    },
    policy: () => policy,
    setFetchHosts: async (fetchHosts) => {
      policy = { ...policy, fetchHosts }
    },
    setEmbedHosts: async (embedHosts) => {
      policy = { ...policy, embedHosts }
    },
    setWidgets: async (widgets) => {
      policy = { ...policy, widgets }
    },
    setDefaults: async (defaults) => {
      policy = { ...policy, defaults }
    },
    keyInfo: async () => key && { ...key, updatedAt: new Date(0), updatedBy: 'First' },
    setKey: async (_actor, credential) => {
      key = {
        last4: credential.key.slice(-4),
        provider: credential.provider,
        model: credential.model ?? null,
      }
      return { last4: key.last4 }
    },
    setKeyModel: async (_actor, model) => {
      if (key) key = { ...key, model }
    },
    removeKey: async () => {
      key = null
    },
    searchKeyInfo: async () =>
      searchKey ? { last4: searchKey.slice(-4), updatedAt: new Date(0), updatedBy: 'First' } : null,
    setSearchKey: async (_actor, secret) => {
      searchKey = secret
      return { last4: secret.slice(-4) }
    },
    removeSearchKey: async () => {
      searchKey = null
    },
  }
  return instance
}

const callerFor = (runtime: ServerRuntime, id: string | null) =>
  appRouter.createCaller(
    createContext(runtime, { actor: id ? { id, email: `${id}@x`, name: id } : null }),
  )

describe('the server’s own settings', () => {
  test('only the app admin reads or changes who can sign up', async () => {
    const runtime = runtimeWith(store())
    const admin = callerFor(runtime, 'first')
    expect(await admin.instance.me()).toEqual({ isAdmin: true })
    expect(await admin.instance.settings()).toMatchObject({ signup: 'invite', key: null })
    await admin.instance.setSignup({ mode: 'open' })
    expect(await admin.instance.settings()).toMatchObject({ signup: 'open' })

    const member = callerFor(runtime, 'second')
    expect(await member.instance.me()).toEqual({ isAdmin: false })
    await expect(member.instance.setSignup({ mode: 'invite' })).rejects.toThrow(/app admin/)
    await expect(callerFor(runtime, null).instance.settings()).rejects.toThrow(/app admin/)
  })

  test('a deployment without a store has no admin', async () => {
    const caller = callerFor(runtimeWith(), 'first')
    expect(await caller.instance.me()).toEqual({ isAdmin: false })
    await expect(caller.instance.settings()).rejects.toThrow(/app admin/)
  })

  test('only the app admin sets the server key, hosts, widgets and defaults', async () => {
    const runtime = runtimeWith(store())
    const admin = callerFor(runtime, 'first')
    const member = callerFor(runtime, 'second')

    expect(await admin.instance.setKey({ key: 'sk-ant-not-real-9f2c' })).toEqual({ last4: '9f2c' })
    expect(await admin.instance.setFetchHosts({ hosts: ['https://API.Example.com/v1'] })).toEqual([
      'api.example.com',
    ])
    expect(await admin.instance.setEmbedHosts({ hosts: ['tally.so'] })).toEqual(['tally.so'])
    await admin.instance.setWidgets({ enabled: false })
    await admin.instance.setDefaults({ approvalMode: 'auto', turnCap: 40 })

    const settings = await admin.instance.settings()
    expect(settings.key).toMatchObject({ last4: '9f2c', provider: 'anthropic' })
    expect(JSON.stringify(settings)).not.toContain('sk-ant')
    expect(settings).toMatchObject({
      fetchHosts: ['api.example.com'],
      embedHosts: ['tally.so'],
      widgets: false,
      defaults: { approvalMode: 'auto', turnCap: 40 },
    })

    const refused = [
      () => member.instance.settings(),
      () => member.instance.setKey({ key: 'sk-ant-member-key-0000' }),
      () => member.instance.setKeyModel({ model: null }),
      () => member.instance.removeKey(),
      () => member.instance.setFetchHosts({ hosts: ['evil.example'] }),
      () => member.instance.setEmbedHosts({ hosts: ['evil.example'] }),
      () => member.instance.setWidgets({ enabled: true }),
      () => member.instance.setDefaults({ approvalMode: 'auto' }),
    ]
    for (const call of refused) await expect(call()).rejects.toThrow(/app admin/)
    expect((await admin.instance.settings()).key?.last4).toBe('9f2c')
  })

  test('only the app admin sets the server’s search key; members see only that it is lent', async () => {
    // The workspace query only asks the instance store, so an opened workspace is never touched.
    const opened = {} as ReturnType<ServerRuntime['resolve']>
    const runtime = { ...runtimeWith(store()), resolve: () => opened }
    const admin = callerFor(runtime, 'first')
    const member = callerFor(runtime, 'second')

    expect(await member.workspaces.serverSearchKey()).toBe(false)
    expect(await admin.instance.setSearchKey({ key: 'exa-not-real-5a1b' })).toEqual({
      last4: '5a1b',
    })
    const settings = await admin.instance.settings()
    expect(settings.searchKey).toMatchObject({ last4: '5a1b', updatedBy: 'First' })
    expect(JSON.stringify(settings)).not.toContain('exa-not-real')
    expect(await member.workspaces.serverSearchKey()).toBe(true)

    await expect(member.instance.setSearchKey({ key: 'exa-member-key-0000' })).rejects.toThrow(
      /app admin/,
    )
    await expect(member.instance.removeSearchKey()).rejects.toThrow(/app admin/)
    await expect(admin.instance.setSearchKey({ key: 'short' })).rejects.toThrow()
    expect((await admin.instance.settings()).searchKey?.last4).toBe('5a1b')

    await admin.instance.removeSearchKey()
    expect(await member.workspaces.serverSearchKey()).toBe(false)
  })

  test('a host list that names an address or a private name is refused in words', async () => {
    const admin = callerFor(runtimeWith(store()), 'first')
    await expect(admin.instance.setFetchHosts({ hosts: ['10.0.0.1'] })).rejects.toThrow(
      /not a host/,
    )
    await expect(admin.instance.setFetchHosts({ hosts: ['printer.local'] })).rejects.toThrow(
      /private/,
    )
    await expect(admin.instance.setEmbedHosts({ hosts: ['not a site'] })).rejects.toThrow(
      /not a site address/,
    )
  })
})
