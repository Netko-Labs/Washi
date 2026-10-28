import type { Recipe } from './types'

/** Props whose zod shape says less than their name: what a reader should picture instead. */
export const PROP_TYPES: Record<string, string> = {
  bind: 'query { table, where, orderBy, limit, groupBy, params }',
  history: 'history { table, column, range }',
  action: 'action { verb, … }',
  onAdd: 'action { verb, … }',
  onOpen: 'action { verb, … }',
  class: 'layout tokens',
  views: 'list of { name, kind, groupBy?, date?, where?, columns? }',
  defaults: 'column → value or { state }',
  seed: 'column → value',
}

/** What each primitive is for, in the reader's words. */
export const SUMMARIES: Record<string, string> = {
  Sheet: 'The page itself: its title, look, theme, feel and declared state.',
  Section: 'A labelled band that groups blocks under a small heading and a rule.',
  Row: 'Lays blocks side by side, wrapping when the page is narrow.',
  Stack: 'Lays blocks top to bottom with an even gap.',
  Grid: 'A twelve-column field; children take span. One column under 400px.',
  Divider: 'A quiet rule between parts of a page.',
  PageLink: 'A link to one page as a block: its icon and title, opened on a press.',
  Subpages:
    'Every page under this one (or of), live, in the sidebar’s order: a list, cards, or a gallery of covers.',
  Columns:
    'Notion’s columns: Columns side by side, each its ratio’s share; they stack under 560px.',
  Column: 'One column inside Columns; ratio 1–6 is its share of the width.',
  Bento: 'A home of tiles packed densely, 3, 4 or 6 across; two across under 720px, one under 400.',
  Tile: 'One cell of a Bento: square, wide, tall, big or a banner across the row.',
  Title: 'A heading, level 1 to 3.',
  Text: 'A paragraph; lead makes it the page’s intro.',
  List: 'Bullets, numbers or checks around Items.',
  Item: 'One entry in a List; done ticks a check list.',
  Quote: 'A pulled quote in serif with a tone rule.',
  Code: 'Preformatted text that wraps and scrolls.',
  Pair: 'A term and its definition, for spec tables and facts.',
  Note: 'A footnote, numbered in document order.',
  Source: 'An attribution, numbered §1 §2… on its own.',
  Money: 'An amount formatted in the reader’s locale; never hand-format money.',
  Mark: 'Highlights a phrase inside Text.',
  Kbd: 'A key cap inside Text.',
  Ref: 'A link to another page by its id.',
  Tag: 'A small label inside Text.',
  Card: 'A box around related blocks, with an optional title.',
  Callout: 'An aside that means something: info, success, warning, danger.',
  Redact: 'Hides what it wraps from a page’s public link.',
  Hero: 'A big opener: title, subtitle, alignment.',
  Figure: 'An https image with a caption; its shape is held while it loads.',
  Repeat: 'Draws its children once per row, with $row in scope.',
  Table: 'Rows as a table; stacks into cards on a phone.',
  Stat: 'One figure with a label, a hint and a trend; reads expr aggregates.',
  Chart: 'Bars, lines, areas or a donut over rows, or a column over time.',
  Timeline: 'A vertical run of Steps.',
  Step: 'One entry on a Timeline: marker, title, body.',
  Progress: 'A bar filled to a ratio, with its percentage.',
  Badge: 'A pill in a tone; can read an expr.',
  Avatar: 'Initials in a circle.',
  Canvas: 'Ideas and the lines between them; hand edits write the page.',
  Node: 'One idea on a Canvas; may link a page.',
  Edge: 'A line between two Nodes.',
  Roadmap: 'One bar per row on a shared calendar, Notion’s timeline.',
  Schema: 'A table’s columns and types, as the page’s spec.',
  Field: 'One cell, edited in place: text, number, select, date, check.',
  Board: 'Cards in columns by a group; drag writes the group and the order.',
  Database: 'A table with views as tabs (table · board · timeline), rows edited in place.',
  Button: 'Runs one action on click.',
  Compose: 'A text box that runs one action with what was typed, then clears.',
  Form: 'One whole row typed and added; trigger puts it behind a button in a modal.',
  Agenda: 'A calendar: a week or a month of rows on their dates; + on a day adds one there.',
  Task: 'A checkbox bound to a row’s checkbox column.',
  Switch: 'Writes true or false to a state key.',
  Select: 'Writes one choice to a state key; views filtered by it follow.',
  Slider: 'Writes a number to a state key.',
  Show: 'Shows its children while an expression holds.',
  Tabs: 'Tab labels over panels; may write the open tab to state.',
  Tab: 'One panel inside Tabs.',
  Reveal: 'A disclosure: a label that opens what it holds.',
  Drawer: 'A side panel that opens while a state key is set; with bind, one row.',
  Chip: 'A dotted status pill.',
  Mascot: 'Washi-chan, once per page, in a mood.',
  Missing: 'Stands in for something the registry lacks, and files the request.',
}

/** Primitives that only work together; each source validates and renders over the book's `tasks`. */
export const RECIPES: Recipe[] = [
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
