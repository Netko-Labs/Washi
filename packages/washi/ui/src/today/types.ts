import type { api } from '../api'

export type TodayWire = Awaited<ReturnType<typeof api.agents.today.query>>

export type TodayTurn = TodayWire['turns'][number]
