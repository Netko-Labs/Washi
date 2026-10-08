import type { api } from '@/lib/rpc'

export type RoutineWire = Awaited<ReturnType<typeof api.routines.list.query>>[number]

export interface RoutineRowProps {
  routine: RoutineWire
  onToggle: (id: string, enabled: boolean) => void
  onRunNow: (id: string) => void
  onRemove: (id: string) => void
}

export interface RoutineFormProps {
  onCreate: (input: { title: string; prompt: string; minuteUtc: number }) => Promise<boolean>
}

export interface RoutineDraft {
  title: string
  prompt: string
  /** HH:MM on this device's clock. */
  time: string
}
