import type { RoutineRun } from '@washi/domain'
import type { RoutineTemplate, ScheduleKind } from './types'

export const ROUTINE_SESSION_PREFIX = 'Routine · '

export const SCHEDULE_KINDS: { id: ScheduleKind; label: string }[] = [
  { id: 'daily', label: 'Every day' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekly', label: 'Some days' },
  { id: 'hourly', label: 'Every hour' },
  { id: 'custom', label: 'Cron' },
]

export const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export const RUN_STATUS: Record<RoutineRun['status'], { label: string; tone: string }> = {
  running: { label: 'Running', tone: 'bg-primary/12 text-primary' },
  waiting: { label: 'Needs you', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  done: { label: 'Done', tone: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' },
  failed: { label: 'Failed', tone: 'bg-destructive/12 text-destructive' },
}

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    key: 'standup',
    title: 'Standup digest',
    cron: '30 8 * * 1-5',
    blurb: 'What moved yesterday, before the standup.',
    prompt:
      'Read the issues and pages that changed since yesterday morning. Update a page titled "Standup" with three short lists: done, in progress, blocked — each item linking its issue.',
  },
  {
    key: 'weekly-review',
    title: 'Weekly review',
    cron: '0 17 * * 5',
    blurb: 'Friday at five: the week in one page.',
    prompt:
      'Write this week’s review on the page titled "Weekly review": what shipped, what slipped and why, and the three things that matter next week.',
  },
  {
    key: 'triage',
    title: 'Triage new issues',
    cron: '0 10 * * 1-5',
    blurb: 'Every morning, new issues get a priority and an owner.',
    prompt:
      'Find issues created since yesterday without a priority or an assignee. Suggest both from the project and recent similar issues, and set them. List what you changed on a page titled "Triage log".',
  },
  {
    key: 'stale',
    title: 'Stale-issue sweep',
    cron: '0 9 * * 1',
    blurb: 'Monday: what nobody touched in two weeks.',
    prompt:
      'Find open issues not updated in 14 days. Add them to a page titled "Stale" grouped by project, with the last thing that happened to each.',
  },
  {
    key: 'digest',
    title: 'Morning digest',
    cron: '0 7 * * *',
    blurb: 'The pages that changed overnight, summarised.',
    prompt: 'Read the pages changed yesterday and update a page titled "Digest" with what moved.',
  },
]

export const EMPTY_TITLE = 'Untitled routine'
