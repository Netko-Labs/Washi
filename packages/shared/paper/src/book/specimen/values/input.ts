import type { Specimen } from '../types'
import { TASKS, WELCOME } from './shared'

export const INPUT_SPECIMENS: Record<string, Specimen> = {
  Field: {
    props: { field: 'title', kind: 'text', label: 'Title', table: 'tasks' },
    wrap: `<Repeat bind={{ table: 'tasks', limit: 1 }}><Here /></Repeat>`,
  },
  Board: {
    props: {
      bind: { table: 'tasks' },
      groupBy: 'status',
      groups: ['todo', 'doing', 'review', 'done'],
      badge: 'priority',
      meta: 'points',
      avatar: 'assignee',
    },
  },
  Database: { props: { table: 'tasks' } },
  Button: { props: { action: { verb: 'sheet.open', sheet: WELCOME } }, children: 'Open welcome' },
  Compose: {
    props: {
      action: {
        verb: 'table.insert',
        table: 'tasks',
        data: {
          title: '$value',
          status: 'todo',
          priority: 'medium',
          assignee: 'Peje',
          due: '2026-10-30',
          points: 1,
          blocked: false,
          labels: '',
          done: false,
        },
      },
      label: 'Add',
      placeholder: 'Add a task',
    },
  },
  Form: {
    props: {
      table: 'tasks',
      fields: ['title', 'priority', 'due', 'points', 'blocked'],
      required: ['title'],
      defaults: { status: 'todo', done: false },
      submit: 'Add task',
    },
    wrap: `<Here /><Repeat bind={{ table: 'tasks', where: [{ column: 'status', op: 'eq', value: 'todo' }] }}><Text>$row.title · $row.priority</Text></Repeat>`,
  },
  Task: { children: '$row.title', wrap: `<Repeat ${TASKS}><Here /></Repeat>` },
  Switch: { props: { state: 'fine', label: 'Show the fine print' } },
  Select: {
    props: { state: 'status', label: 'Status', options: ['todo', 'doing', 'done'], all: 'Any' },
    wrap: `<Here /><Repeat bind={{ table: 'tasks', where: [{ column: 'status', op: 'eq', value: { state: 'status' } }] }}><Text>$row.title</Text></Repeat>`,
  },
  Slider: { props: { state: 'points', min: 0, max: 13, step: 1, label: 'Points' } },

  Show: {
    props: { expr: 'fine = true' },
    children: '<Callout tone="info">Shown because the state key is true.</Callout>',
    wrap: '<Switch state="fine" label="fine" /><Here />',
  },
  Tabs: {
    props: { labels: ['Board', 'Notes'], state: 'tab' },
    children: '<Tab><Text>Panel one.</Text></Tab><Tab><Text>Panel two.</Text></Tab>',
  },
  Tab: {
    children: '<Text>This panel.</Text>',
    wrap: `<Tabs labels={['This', 'That']}><Here /><Tab><Text>That panel.</Text></Tab></Tabs>`,
  },
  Reveal: {
    props: { label: 'Reveal the fine print' },
    children: '<Text size="sm">Hidden until asked.</Text>',
  },
  Drawer: {
    props: { state: 'issue', bind: { table: 'tasks' }, title: '$row.title' },
    children: '<Text>$row.assignee · $row.status</Text>',
    wrap: `<Repeat ${TASKS}><Button variant="outline" action={{ verb: 'state.set', key: 'issue', value: '$row.id' }}>Open $row.title</Button></Repeat><Here />`,
  },

  Chip: { props: { tone: 'success' }, children: 'shipped' },
  Mascot: { props: { mood: 'happy', size: 'md' } },
  Missing: { props: { kind: 'Map', reason: 'rows placed on a map by their address' } },
}
