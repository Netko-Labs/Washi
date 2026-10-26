import { describe, expect, test } from 'bun:test'
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
  const instance: InstanceStore = {
    isAdmin: async (id) => id === 'first',
    signup: async () => signup,
    setSignup: async (mode) => {
      signup = mode
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
    expect(await admin.instance.settings()).toEqual({ signup: 'invite' })
    await admin.instance.setSignup({ mode: 'open' })
    expect(await admin.instance.settings()).toEqual({ signup: 'open' })

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
})
