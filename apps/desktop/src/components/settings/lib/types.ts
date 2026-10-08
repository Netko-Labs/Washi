import type { api } from '@/lib/rpc'

export type InferenceWire = Awaited<ReturnType<typeof api.agents.inference.query>>
export type SpendWire = Awaited<ReturnType<typeof api.agents.spend.query>>
export type InferencePreference = InferenceWire['preference']
export type LocalModel = NonNullable<InferenceWire['localModel']>
