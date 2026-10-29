import type { TableSeed } from './types'

/** Checklist items and activity for the issues above; comments are activity of kind comment. */
export const ISSUE_EXTRAS: TableSeed[] = [
  {
    spec: {
      name: 'checks',
      columns: [
        { name: 'issue', type: 'text' },
        { name: 'label', type: 'text' },
        { name: 'done', type: 'boolean' },
      ],
    },
    rows: [
      { issue: 'WSX-101', label: 'Facet from column', done: true },
      { issue: 'WSX-101', label: '$scope in expr', done: true },
      { issue: 'WSX-101', label: 'Stored per reader', done: false },
      { issue: 'WSX-103', label: 'Countdown mode', done: true },
      { issue: 'WSX-103', label: 'Visibility suspend', done: false },
      { issue: 'WSX-105', label: 'Date axis', done: true },
      { issue: 'WSX-105', label: 'Windowing', done: true },
      { issue: 'WSX-105', label: 'Budget accounting', done: false },
      { issue: 'WSX-108', label: 'Month view', done: true },
      { issue: 'WSX-108', label: 'Agenda view', done: true },
    ],
  },
  {
    spec: {
      name: 'activity',
      columns: [
        { name: 'issue', type: 'text' },
        { name: 'kind', type: 'select', options: ['comment', 'created', 'moved', 'flagged'] },
        { name: 'who', type: 'text' },
        { name: 'body', type: 'text' },
        { name: 'at', type: 'text' },
      ],
    },
    rows: [
      {
        issue: 'WSX-101',
        kind: 'created',
        who: 'Peje',
        body: 'created this issue',
        at: '2026-09-08T09:10:00Z',
      },
      {
        issue: 'WSX-101',
        kind: 'moved',
        who: 'Peje',
        body: 'moved this from To do to In progress',
        at: '2026-09-09T08:30:00Z',
      },
      {
        issue: 'WSX-101',
        kind: 'comment',
        who: 'Mira Kaneko',
        body: 'Reading room proves it — one scope, three consumers, no bind repeated.',
        at: '2026-09-09T10:12:00Z',
      },
      {
        issue: 'WSX-103',
        kind: 'created',
        who: 'Mira Kaneko',
        body: 'created this issue',
        at: '2026-09-08T09:14:00Z',
      },
      {
        issue: 'WSX-105',
        kind: 'flagged',
        who: 'Awa',
        body: 'blocked on whether the budget counts rendered cells or declared ones',
        at: '2026-09-09T06:40:00Z',
      },
      {
        issue: 'WSX-105',
        kind: 'comment',
        who: 'Awa',
        body: 'Leaning towards declared — rendered would make the budget depend on the window.',
        at: '2026-09-09T06:42:00Z',
      },
      {
        issue: 'WSX-106',
        kind: 'created',
        who: 'Peje',
        body: 'created this issue',
        at: '2026-09-09T07:05:00Z',
      },
    ],
  },
]
