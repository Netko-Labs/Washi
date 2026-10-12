import type { ExprScope, ExprScopeShape } from '../../index'

const TASKS = [
  { id: 't1', status: 'open', points: 3, done: false, due: '2026-09-10' },
  { id: 't2', status: 'done', points: 5, done: true, due: '2026-09-01' },
  { id: 't3', status: 'open', points: null, done: false, due: null },
  { id: 't4', status: 'open', points: 8, done: false, due: '2026-09-30' },
]

const ARGS: ExprScope['args'] = Object.fromEntries([
  ['$row', { id: 't1', points: 3, status: 'open' }],
  ['$value', 42],
  ['$group', 'open'],
])

export const SCOPE: ExprScope = {
  state: { budget: 10, done_count: 1, label: 'Q3', flag: true, status: 'state-status' },
  args: ARGS,
  rows: (table) => (table === 'tasks' ? TASKS : undefined),
  scopeRows: TASKS.slice(0, 2),
  now: Date.UTC(2026, 8, 8),
}

export const SHAPE: ExprScopeShape = {
  state: ['budget', 'done_count', 'label', 'flag', 'status'],
  args: ['$row', '$value', '$group'],
  tables: { tasks: ['id', 'status', 'points', 'done', 'due'] },
  scopeColumns: ['id', 'points', 'status'],
}
