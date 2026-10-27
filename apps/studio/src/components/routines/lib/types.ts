import type { RoutineRun } from '@washi/domain'
import type { api } from '@/integrations/trpc'

export type RoutineWire = Awaited<ReturnType<typeof api.routines.list.query>>[number]

export type ScheduleKind = 'daily' | 'weekdays' | 'weekly' | 'hourly' | 'custom'

/** The schedule as the form edits it; `cronFromSchedule` turns it into the stored cron. */
export interface ScheduleDraft {
  kind: ScheduleKind
  /** HH:MM; the minute alone for hourly. */
  time: string
  /** 0 = Sunday; weekly only. */
  days: number[]
  cron: string
  timeZone: string
}

export interface RoutineDraft {
  title: string
  prompt: string
  schedule: ScheduleDraft
}

export interface RoutineTemplate {
  key: string
  title: string
  prompt: string
  cron: string
  blurb: string
}

export type RoutineTab = 'setup' | 'runs'

export interface RoutinesPageProps {
  workspaceId: string
}

export interface RoutineListRowProps {
  workspaceId: string
  routine: RoutineWire
  onToggle: (enabled: boolean) => void
}

export interface RoutinePageProps {
  workspaceId: string
  /** None is a new routine, maybe from a template. */
  routineId?: string
  template?: string
  tab: RoutineTab
}

export interface RoutineSetupProps {
  draft: RoutineDraft
  onDraft: (draft: RoutineDraft) => void
  isNew: boolean
  isSaving: boolean
  isChanged: boolean
  onSave: () => void
  onRemove?: () => void
}

export interface SchedulePickerProps {
  value: ScheduleDraft
  onChange: (value: ScheduleDraft) => void
}

export interface RoutineRunsProps {
  workspaceId: string
  runs: RoutineRun[]
}

export interface RunStatusBadgeProps {
  status: RoutineRun['status']
}

export interface RoutineSaveState {
  isSaving: boolean
  error: string | null
  missing: boolean
}

export interface ToggleSwitchProps {
  isOn: boolean
  label: string
  onChange: (isOn: boolean) => void
}
