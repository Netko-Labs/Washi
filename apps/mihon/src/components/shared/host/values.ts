import type { SeedTable } from './types'

export const WELCOME_SHEET = { title: 'Welcome to Washi', icon: 'sparkles' }

export const PEOPLE = [
  { id: 'p1', name: 'Peje' },
  { id: 'p2', name: 'Mira Kaneko' },
  { id: 'p3', name: 'Awa' },
]

/** The table every bound specimen reads: the desktop showcase's `tasks`, in memory. */
export const SEED_TABLES: SeedTable[] = [
  {
    spec: {
      name: 'tasks',
      columns: [
        { name: 'title', type: 'text' },
        { name: 'status', type: 'select', options: ['todo', 'doing', 'review', 'done'] },
        { name: 'priority', type: 'select', options: ['low', 'medium', 'high'] },
        { name: 'assignee', type: 'text' },
        { name: 'due', type: 'date' },
        { name: 'points', type: 'number' },
        { name: 'blocked', type: 'boolean' },
        { name: 'labels', type: 'text' },
        { name: 'done', type: 'boolean' },
      ],
    },
    rows: [
      {
        title: 'Compare, Diff and Tree',
        status: 'todo',
        priority: 'medium',
        assignee: 'Mira Kaneko',
        due: '2026-11-04',
        points: 5,
        blocked: false,
        labels: 'spec',
        done: false,
      },
      {
        title: 'Filter scope over binds',
        status: 'doing',
        priority: 'high',
        assignee: 'Peje',
        due: '2026-10-24',
        points: 5,
        blocked: false,
        labels: 'infra · spec',
        done: false,
      },
      {
        title: 'Timer as the only tick source',
        status: 'doing',
        priority: 'high',
        assignee: 'Mira Kaneko',
        due: '2026-10-22',
        points: 3,
        blocked: false,
        labels: 'infra',
        done: false,
      },
      {
        title: 'Matrix virtualisation',
        status: 'review',
        priority: 'medium',
        assignee: 'Awa',
        due: '2026-10-21',
        points: 3,
        blocked: true,
        labels: 'ui',
        done: false,
      },
      {
        title: 'Derived views in the vault',
        status: 'review',
        priority: 'high',
        assignee: 'Peje',
        due: '2026-10-26',
        points: 8,
        blocked: false,
        labels: 'infra',
        done: false,
      },
      {
        title: 'Calendar wrap',
        status: 'done',
        priority: 'low',
        assignee: 'Awa',
        due: '2026-10-18',
        points: 2,
        blocked: false,
        labels: 'ui',
        done: true,
      },
      {
        title: 'Money and vault locale',
        status: 'done',
        priority: 'medium',
        assignee: 'Mira Kaneko',
        due: '2026-10-15',
        points: 2,
        blocked: false,
        labels: 'spec',
        done: true,
      },
    ],
  },
]
