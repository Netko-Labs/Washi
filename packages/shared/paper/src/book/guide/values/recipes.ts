import type { Recipe } from '../types'

/** Primitives that only work together; each source validates and renders over the book's `tasks`. */
export const RECIPES: Recipe[] = [
  {
    id: 'guide',
    title: 'A how-to with its questions',
    why: 'A knowledge-base page that reads well: the steps in order, the choice made plain, the questions answered, the day it matters by.',
    uses: ['Steps', 'Compare', 'Faq', 'Countdown'],
    source: `<Sheet title="Cutting a release" feel="editorial">
  <Countdown to="2026-12-01" label="Until the freeze" />
  <Steps>
    <Step title="Cut the branch"><Code lang="sh">git switch -c release/2026.12</Code></Step>
    <Step title="Run the checks"><Text>Typecheck, lint and tests, all green.</Text></Step>
    <Step title="Tag and push"><Text>The tag is what deploys.</Text></Step>
  </Steps>
  <Compare>
    <Option title="Weekly"><List><Item>A rhythm people plan around</Item><Item>Fixes wait for Friday</Item></List></Option>
    <Option title="On every merge" pick><List><Item>Small, easy to undo</Item><Item>Needs checks you trust</Item></List></Option>
  </Compare>
  <Faq>
    <Question title="What if a check fails?"><Text>Fix it on the branch; never tag around it.</Text></Question>
    <Question title="Who can tag?"><Text>Anyone who reviewed the release.</Text></Question>
  </Faq>
</Sheet>`,
  },
  {
    id: 'gallery',
    title: 'A gallery of rows',
    why: 'Notion’s gallery: a card per row wearing its cover, a few properties under the title; a press opens the row.',
    uses: ['Database'],
    source: `<Sheet title="Classes">
  <Database table="classes" width="wide" views={[{ name: 'Gallery', kind: 'gallery', cover: 'cover', columns: ['term', 'grade'] }, { name: 'Table', kind: 'table' }]} />
</Sheet>`,
  },
  {
    id: 'code',
    title: 'A page that computes',
    why: 'When primitives alone cannot say it: the page opens with code — hooks from washi, date-fns, lodash — and its markup takes expressions, its own components and presses that write. It runs inside a workspace, sandboxed.',
    uses: ['Stat', 'List', 'Item', 'Button'],
    source: `import { useRows, useInsert } from 'washi'
import { sumBy } from 'lodash-es'

function Total({ rows }) {
  return <Stat label="Spent" value={sumBy(rows, 'amount')} />
}

const rows = useRows({ table: 'expenses' })
const add = useInsert('expenses')

<Sheet title="Spending">
  <Title>Spending</Title>
  <Total rows={rows} />
  <List>{rows.map((row) => <Item key={row.id}>{row.name} · {row.amount}</Item>)}</List>
  <Button onPress={() => add({ name: 'Coffee', amount: 4 })}>Add a coffee</Button>
</Sheet>`,
  },
  {
    id: 'widget',
    title: 'A drawing primitives can’t make',
    why: 'When no primitive draws it — a dial, a canvas, a custom chart: a component in the page’s code, drawn by a Widget in its own frame. Its rows come through washi’s hooks; a press inside it writes.',
    uses: ['Widget', 'Stat'],
    source: `import { useRows } from 'washi'

function Dial({ done, total }) {
  const turn = total ? done / total : 0
  return (
    <svg viewBox="0 0 100 100" width="120" height="120">
      <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10" style={{ stroke: 'var(--border)' }} />
      <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10" pathLength="1" strokeDasharray={\`\${turn} 1\`} transform="rotate(-90 50 50)" style={{ stroke: 'var(--accent)' }} />
    </svg>
  )
}

const tasks = useRows({ table: 'tasks' })
const done = tasks.filter((task) => task.status === 'done').length

<Sheet title="Progress">
  <Stat label="Done" value={done} />
  <Widget title="How far" height={140}><Dial done={done} total={tasks.length} /></Widget>
</Sheet>`,
  },
  {
    id: 'terminal',
    title: 'A script, run as it is',
    why: 'Someone’s Node program — an ASCII animation, a small tool — pasted unchanged into a Terminal: console.log draws its screen, the uploads it reads are attached as files, a press runs it.',
    uses: ['Terminal', 'Text'],
    source: `<Sheet title="Run a script">
  <Text>Paste a Node program, attach the files it reads, press Run.</Text>
  <Terminal title="Spinner" height={180}>{\`const spin = ['◐', '◓', '◑', '◒']
let step = 0
const timer = setInterval(() => {
  console.clear()
  console.log(spin[step % 4] + ' Working… ' + step + '/20')
  step += 1
  if (step > 20) {
    clearInterval(timer)
    console.log('Done.')
  }
}, 100)\`}</Terminal>
</Sheet>`,
  },
  {
    id: 'hub',
    title: 'A hub for its pages',
    why: 'A main page for a part of life: its figures on top, every page under it as cards with their covers, one pinned link.',
    uses: ['Subpages', 'PageLink', 'Stat', 'Columns'],
    source: `<Sheet title="Finances" icon="💸">
  <Columns>
    <Column><Stat label="Open tasks" expr="count(tasks where status != 'done')" /></Column>
    <Column ratio={2}><Text emphasis="quiet">Start from the budget; everything else is one press away.</Text><PageLink sheet="budget" /></Column>
  </Columns>
  <Section title="Pages"><Subpages layout="gallery" /></Section>
  <Section title="This month"><Include sheet="budget" /></Section>
  <Section title="Linked from"><Backlinks /></Section>
</Sheet>`,
  },
  {
    id: 'home',
    title: 'A home in tiles',
    why: 'A command centre: figures, today, the board and the way in, each a tile sized by what it holds.',
    uses: ['Bento', 'Tile', 'Stat', 'Agenda', 'Board'],
    source: `<Sheet title="Home" feel="board">
  <Bento width="wide">
    <Tile shape="big" title="This week"><Agenda bind={{ table: 'tasks' }} date="due" title="title" badge="priority" /></Tile>
    <Tile title="Open"><Stat label="Tasks" expr="count(tasks where status != 'done')" /></Tile>
    <Tile title="Points"><Stat label="Points" expr="sum(tasks.points)" trend="up" /></Tile>
    <Tile shape="wide" variant="filled" tone="accent" title="Reminders"><List><Item>Notes due Friday</Item><Item>Review at 17:00</Item></List></Tile>
    <Tile shape="banner" title="Board"><Board bind={{ table: 'tasks' }} groupBy="status" groups={['todo', 'doing', 'done']} title="title" /></Tile>
  </Bento>
</Sheet>`,
  },
  {
    id: 'columns',
    title: 'A page in three columns',
    why: 'Notion’s layout: a narrow rail, the work in the middle, the glance on the right.',
    uses: ['Columns', 'Column', 'Card', 'Table', 'Stat'],
    source: `<Sheet title="Semester">
  <Columns width="wide">
    <Column><Card title="Navigation"><List><Item>Assignments</Item><Item>Planners</Item><Item>Study room</Item></List></Card></Column>
    <Column ratio={3}><Table bind={{ table: 'tasks', limit: 5 }} columns={['title', 'status', 'due']} /></Column>
    <Column ratio={1}><Stat label="Open" expr="count(tasks where status != 'done')" /><Callout tone="accent" title="Reminders">First day of classes.</Callout></Column>
  </Columns>
</Sheet>`,
  },
  {
    id: 'dashboard',
    title: 'A dashboard',
    why: 'Figures first, then where they come from: Stats in a Grid over a Chart.',
    uses: ['Grid', 'Card', 'Stat', 'Progress', 'Chart'],
    source: `<Sheet title="Dashboard" feel="board">
  <Grid width="wide">
    <Card span={4}><Stat label="Open" expr="count(tasks where status != 'done')" /></Card>
    <Card span={4}><Stat label="Points" expr="sum(tasks.points)" trend="up" /></Card>
    <Card span={4}><Progress label="Done" expr="count(tasks where status = 'done') / count(tasks)" /></Card>
  </Grid>
  <Chart kind="bar" bind={{ table: 'tasks', groupBy: { column: 'status', aggregates: [{ fn: 'sum', column: 'points' }] } }} width="wide" />
</Sheet>`,
  },
  {
    id: 'kanban',
    title: 'A kanban and its table',
    why: 'Drag cards between columns; the same rows as a table one tab over.',
    uses: ['Board', 'Database'],
    source: `<Sheet title="Sprint">
  <Board bind={{ table: 'tasks' }} groupBy="status" groups={['todo', 'doing', 'review', 'done']} title="title" badge="priority" meta="points" width="full" />
  <Database table="tasks" width="full" views={[{ name: 'All', kind: 'table', columns: ['title', 'status', 'priority', 'due'] }, { name: 'Board', kind: 'board', groupBy: 'status' }]} />
</Sheet>`,
  },
  {
    id: 'week',
    title: 'A week with an add button',
    why: 'The week reads the table; the button adds a row in a modal.',
    uses: ['Row', 'Form', 'Agenda'],
    source: `<Sheet title="This week">
  <Row align="center">
    <Text class="grow" emphasis="quiet">Everything due this week.</Text>
    <Form table="tasks" trigger="Add task" fields={['title', 'due', 'priority']} defaults={{ status: 'todo' }} submit="Add task" />
  </Row>
  <Agenda bind={{ table: 'tasks' }} date="due" title="title" badge="priority" add={['title', 'priority']} addLabel="Add task" width="wide" />
</Sheet>`,
  },
  {
    id: 'month',
    title: 'A month that follows a picker',
    why: 'One state key moves the picker, the grid and every figure filtered by it.',
    uses: ['Select', 'Stat', 'Agenda'],
    source: `<Sheet title="Month" state={{ local: { picked_month: '2026-10' } }}>
  <Row align="center">
    <Select state="picked_month" label="Month" options={['2026-09', '2026-10', '2026-11']} />
    <Stat label="Due this month" expr="count(tasks where month(due) = picked_month)" />
  </Row>
  <Agenda view="month" state="picked_month" bind={{ table: 'tasks' }} date="due" title="title" badge="priority" width="wide" />
</Sheet>`,
  },
  {
    id: 'filter',
    title: 'A list a picker filters',
    why: 'A Select writes state; the Table’s where reads it. Unset, the filter drops.',
    uses: ['Select', 'Table'],
    source: `<Sheet title="By status" state={{ local: { picked_status: null } }}>
  <Select state="picked_status" label="Status" all="Every status" options={['todo', 'doing', 'review', 'done']} />
  <Table bind={{ table: 'tasks', where: [{ column: 'status', op: 'eq', value: { state: 'picked_status' } }] }} columns={['title', 'status', 'priority', 'points']} />
</Sheet>`,
  },
  {
    id: 'checklist',
    title: 'A checklist over rows',
    why: 'Repeat draws one line per row; Task ticks the row’s checkbox column.',
    uses: ['Repeat', 'Row', 'Task', 'Badge'],
    source: `<Sheet title="Checklist">
  <Repeat bind={{ table: 'tasks', limit: 5 }}>
    <Row align="center"><Task row="$row.id" field="done">$row.title</Task><Badge>$row.priority</Badge></Row>
  </Repeat>
</Sheet>`,
  },
]
