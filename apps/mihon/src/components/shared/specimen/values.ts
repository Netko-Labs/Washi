import type { Specimen } from './types'

const WELCOME = 'welcome'
const TASKS = `bind={{ table: 'tasks', limit: 3 }}`

/** State every specimen sheet declares, so Show, Tabs, Switch, Select, Slider and Drawer have keys. */
export const SPECIMEN_STATE = { tab: 'Board', fine: true, points: 5, issue: '', status: '' }

/** One default for every primitive but Sheet. Knobs override props; wraps satisfy `within`. */
export const SPECIMENS: Record<string, Specimen> = {
  Section: {
    props: { title: 'This week' },
    children:
      '<Text>Three issues shipped, one slipped.</Text><Text size="sm" emphasis="quiet">One more in review.</Text>',
  },
  Row: {
    props: { align: 'center' },
    children: '<Avatar label="Juan" /><Text>Juan</Text><Chip>owner</Chip>',
  },
  Stack: {
    children:
      '<Card title="One"><Text size="sm">First.</Text></Card><Card title="Two"><Text size="sm">Second.</Text></Card>',
  },
  Grid: {
    children:
      '<Card span={8} variant="outline"><Text size="sm">span 8</Text></Card><Card span={4} variant="filled"><Text size="sm">span 4</Text></Card><Card span={4} variant="filled"><Text size="sm">4</Text></Card><Card span={4} variant="filled"><Text size="sm">4</Text></Card><Card span={4} variant="filled"><Text size="sm">4</Text></Card>',
  },
  Divider: {},

  Title: { props: { level: 1 }, children: 'Weekly review' },
  Text: {
    children: 'The format is the argument: a page that reads like paper and runs like a program.',
  },
  List: {
    props: { marker: 'bullet' },
    children:
      '<Item>Cut the release branch</Item><Item>Notarize the build</Item><Item>Write the notes</Item>',
  },
  Item: {
    props: { done: true },
    children: 'Cut the release branch',
    wrap: '<List marker="check"><Here /><Item>Notarize the build</Item></List>',
  },
  Quote: { children: 'Nothing here names a colour, a size in px or a margin.' },
  Code: { props: { lang: 'json' }, children: '{ "ok": true }' },
  Pair: { props: { term: 'Measure' }, children: 'The width the feel gives the page.' },
  Note: { children: 'A footnote, numbered by the renderer.' },
  Source: { children: 'washi.md, 2026' },
  Money: { props: { value: 1234.5, currency: 'EUR' } },
  Mark: { children: 'the point', wrap: '<Text>Read <Here /> and move on.</Text>' },
  Kbd: { children: '⌘J', wrap: '<Text>Press <Here /> to open the palette.</Text>' },
  Ref: {
    props: { sheet: WELCOME },
    children: 'the welcome page',
    wrap: '<Text>See <Here />.</Text>',
  },
  Tag: { children: 'spec', wrap: '<Text>Filed under <Here />.</Text>' },

  Card: {
    props: { title: 'Outline' },
    children: '<Text size="sm">Hairline border, the default.</Text>',
  },
  Callout: {
    props: { tone: 'info', title: 'Binds refresh on open' },
    children: 'Every bound block refetches when the page opens.',
  },
  Redact: {
    props: { reason: 'client names' },
    children: '<Text>Signed with Acme and Kōbō this quarter.</Text>',
  },
  Hero: { props: { title: 'Q3 board', subtitle: 'Drag to move. Changes save.' } },
  Figure: {
    props: {
      src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=70',
      alt: 'Mountains under a night sky',
      caption: 'Aspect is held before the bytes arrive.',
      ratio: '16:9',
    },
  },

  Repeat: {
    props: { bind: { table: 'tasks', limit: 3 } },
    children:
      '<Row align="center"><Text class="grow">$row.title</Text><Badge>$row.status</Badge><Avatar label="$row.assignee" size="sm" /></Row>',
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
  Badge: { children: 'doing' },
  Avatar: { props: { label: 'Mira Kaneko' } },
  Schema: { props: { table: 'tasks' } },

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
  Missing: { props: { kind: 'Calendar', reason: 'rows placed by date; not in the registry yet' } },
}
