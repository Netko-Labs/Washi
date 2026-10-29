import type { Specimen } from '../types'

export const DATA_SPECIMENS: Record<string, Specimen> = {
  Repeat: {
    props: { bind: { table: 'tasks', limit: 3 } },
    children:
      '<Row align="center"><Text class="grow">$row.title</Text><Badge>$row.status</Badge><Avatar label="$row.assignee" size="sm" /></Row>',
  },
  Heatmap: {
    props: {
      bind: { table: 'tasks' },
      date: 'due',
      value: 'points',
      weeks: 8,
      label: 'Points due',
    },
  },
  Slots: {
    props: {
      bind: { table: 'tasks' },
      date: 'due',
      minutes: 60,
      hours: '09:00-13:00',
      add: ['title', 'priority'],
      addLabel: 'Book',
    },
  },
  Agenda: {
    props: {
      bind: { table: 'tasks' },
      date: 'due',
      title: 'title',
      badge: 'priority',
      add: ['title', 'priority', 'points'],
      addLabel: 'Add task',
    },
  },
  Table: {
    props: { bind: { table: 'tasks', limit: 4 }, columns: ['title', 'status', 'assignee'] },
  },
  Stat: {
    props: { label: 'story points', expr: 'sum(tasks.points)', hint: 'sum(points)', trend: 'up' },
  },
  Chart: {
    props: {
      bind: {
        table: 'tasks',
        groupBy: { column: 'status', aggregates: [{ fn: 'sum', column: 'points' }] },
      },
      kind: 'bar',
    },
  },
  Timeline: {
    children:
      '<Step marker="1" title="Capture">A note starts as one line.</Step><Step marker="2" title="Fold" tone="info">Washi tags and links it.</Step><Step marker="3" title="Recall" tone="success">It comes back when needed.</Step>',
  },
  Step: {
    props: { marker: '2', title: 'Fold' },
    children: 'Washi tags and links it.',
    wrap: '<Timeline><Step marker="1" title="Capture">A note starts as one line.</Step><Here /></Timeline>',
  },
  Canvas: {
    children:
      '<Node id="idea" x={40} y={40}>An idea</Node><Node id="page" x={320} y={120} tone="info">A page</Node><Edge from="idea" to="page" label="becomes" />',
  },
  Node: {
    props: { id: 'idea', x: 40, y: 40 },
    children: 'An idea',
    wrap: '<Canvas><Here /><Node id="page" x={320} y={120} tone="info">A page</Node><Edge from="idea" to="page" /></Canvas>',
  },
  Edge: {
    props: { from: 'idea', to: 'page', label: 'becomes' },
    wrap: '<Canvas><Node id="idea" x={40} y={40}>An idea</Node><Node id="page" x={320} y={120}>A page</Node><Here /></Canvas>',
  },
  Roadmap: { props: { bind: { table: 'tasks' }, date: 'due', title: 'title' } },
  Progress: { props: { value: 0.6, label: 'done / total' } },
  Badge: { props: { tone: 'info' }, children: 'doing' },
  Avatar: { props: { label: 'Mira Kaneko' } },
  Schema: { props: { table: 'tasks' } },
}
