/**
 * The five reference apps (WSX Apps.dc.html) on the registry as it stands.
 * Capabilities the registry lacks are written as <Missing>, never faked.
 */

export const BOARD = `<Sheet title="Registry build" icon="kanban" feel="board" tags={['board', 'tasks']} visibility="shared" wsx="1">
  <Row align="center">
    <Text emphasis="quiet" size="sm" class="grow">Board · bind tasks · visibility shared</Text>
    <Avatar label="Mira Kaneko" size="sm" tone="info" /><Avatar label="Peje" size="sm" tone="accent" /><Avatar label="Awa" size="sm" tone="success" />
  </Row>
  <Hero title="Registry build" subtitle="Every card is a live row. Drag a card between columns or within one — each drop is one table.reorder — and the cards below edit in place." size="md" />
  <Row>
    <Stat label="cards" expr="count(tasks)" />
    <Stat label="points in scope" expr="sum(tasks.points)" />
    <Stat label="in review" expr="count(tasks where status = 'review')" tone="info" />
    <Stat label="blocked" expr="count(tasks where blocked = true)" tone="danger" />
  </Row>
  <Missing kind="Filter" reason="priority facets and search with a live shown-of-total — one scope the board and the stats inherit" />
  <Board bind={{ table: 'tasks' }} groupBy="status" groups={['todo', 'doing', 'review', 'done']} badge="priority" meta="points" avatar="assignee" />
  <Section title="Cards · sorted by due">
    <Repeat bind={{ table: 'tasks', orderBy: { column: 'due', direction: 'asc' } }} empty="No cards yet — add one below.">
      <Card title="$row.title">
        <Row align="center">
          <Badge tone="info">$row.status</Badge><Badge tone="warning">$row.priority</Badge><Tag>$row.labels</Tag>
          <Text size="sm" emphasis="quiet" class="grow">due $row.due · $row.points pts</Text>
          <Avatar label="$row.assignee" size="sm" />
        </Row>
        <Grid gap="tight">
          <Field span={3} field="status" kind="select" label="Status" table="tasks" help="todo · doing · review · done" />
          <Field span={3} field="priority" kind="select" label="Priority" table="tasks" help="low · medium · high" />
          <Field span={3} field="points" kind="number" label="Points" table="tasks" />
          <Field span={3} field="due" kind="date" label="Due" table="tasks" />
        </Grid>
        <Row align="center"><Field field="blocked" kind="boolean" label="Blocked" table="tasks" /><Task>done</Task></Row>
      </Card>
    </Repeat>
    <Button action={{ verb: 'table.insert', table: 'tasks', data: { title: 'New card', status: 'todo', priority: 'medium', assignee: 'Peje', due: '2026-09-30', points: 1, blocked: false, labels: '', done: false } }}>Add card</Button>
  </Section>
  <Section title="Table schema · tasks">
    <Text size="sm" emphasis="quiet">Fields are vault-level — defined once, carried by every card. Adding a field never breaks existing cards; new columns default empty.</Text>
    <Pair term="title">text · n/a</Pair>
    <Pair term="status">select · table.reorder</Pair>
    <Pair term="priority">select · table.update</Pair>
    <Pair term="assignee">text · table.update</Pair>
    <Pair term="due">date · table.update</Pair>
    <Pair term="points">number · table.update</Pair>
    <Pair term="blocked">boolean · table.update</Pair>
  </Section>
</Sheet>
`

export const HABITS = `<Sheet title="Daily practice" icon="sun" theme="matcha" tags={['habits']} wsx="1">
  <Hero title="Daily practice" subtitle="Four habits, twenty-eight days. Matrix and Calendar read the same rows, side by side." size="md" />
  <Grid>
    <Card span={4}><Stat label="best streak" expr="max(habits.best)" hint="days" /></Card>
    <Card span={4}><Stat label="28-day rate" expr="avg(habits.rate)" hint="percent, all habits" /></Card>
    <Card span={4}><Stat label="today" expr="count(habits where done = true)" hint="of 4" /></Card>
  </Grid>
  <Section title="Habit matrix · last 28 days">
    <Missing kind="Matrix" reason="4 habits × 28 tappable day cells — one node against the budget whatever the cell count" />
  </Section>
  <Section title="Rate · today">
    <Repeat bind={{ table: 'habits' }}>
      <Row align="center">
        <Task class="grow">$row.name</Task>
        <Text size="sm" emphasis="quiet">$row.streak-day streak · best $row.best</Text>
        <Progress expr="$row.rate / 100" size="sm" />
      </Row>
    </Repeat>
  </Section>
  <Grid>
    <Card span={6} title="Completions per week"><Chart bind={{ table: 'habit_weeks' }} kind="bar" /></Card>
    <Card span={6} title="Weekday strength"><Chart bind={{ table: 'weekdays' }} kind="bar" /></Card>
  </Grid>
  <Section title="Calendar · month">
    <Missing kind="Calendar" reason="rows placed by date — per-day density is habits completed that day" />
  </Section>
  <Show expr="max(weekdays.rate) - min(weekdays.rate) > 15">
    <Callout tone="info" title="Pattern">Your weekday spread is over 15 points — weekends carry the streak. Move the hardest habit to Saturday.</Callout>
  </Show>
</Sheet>
`

export const SPLIT = `<Sheet title="Hakone trip" icon="money" theme="kraft" tags={['split', 'money']} wsx="1">
  <Hero title="Hakone trip" subtitle="Three people, one ryokan. Every figure goes through Money — the page computes, the vault locale formats." size="md" />
  <Grid>
    <Card span={6} title="Total"><Title level={2}><Money expr="sum(expenses.amount)" currency="JPY" /></Title></Card>
    <Card span={6} title="Each"><Title level={2}><Money expr="sum(expenses.amount) / 3" currency="JPY" /></Title></Card>
  </Grid>
  <Section title="Expenses · bind expenses">
    <Table bind={{ table: 'expenses' }} columns={['item', 'payer', 'amount']} />
    <Row>
      <Button action={{ verb: 'table.insert', table: 'expenses', data: { item: 'Convenience store', payer: 'Peje', amount: 1200 } }}>Add ¥1,200 · Peje</Button>
      <Button variant="outline" action={{ verb: 'table.insert', table: 'expenses', data: { item: 'Bus to Owakudani', payer: 'Awa', amount: 2400 } }}>Add ¥2,400 · Awa</Button>
    </Row>
  </Section>
  <Grid>
    <Card span={6} title="Share by person"><Chart bind={{ table: 'expenses', groupBy: { column: 'payer', aggregates: [{ fn: 'sum', column: 'amount' }] } }} kind="donut" /></Card>
    <Card span={6} title="Balances">
      <Pair term="Mira"><Money expr="sum(expenses.amount where payer = 'Mira') - sum(expenses.amount) / 3" currency="JPY" /></Pair>
      <Pair term="Peje"><Money expr="sum(expenses.amount where payer = 'Peje') - sum(expenses.amount) / 3" currency="JPY" /></Pair>
      <Pair term="Awa"><Money expr="sum(expenses.amount where payer = 'Awa') - sum(expenses.amount) / 3" currency="JPY" /></Pair>
      <Text size="sm" emphasis="quiet">Positive is owed, negative owes. Rounded once, at render.</Text>
    </Card>
  </Grid>
  <Section title="Derived view · settlements">
    <Missing kind="View" reason="settlements — a graph reduction the vault computes and the page binds read-only; never expressible in expr" />
  </Section>
</Sheet>
`

const SET_ROW = `<Row align="center"><Task>Set $row.set_no</Task><Field field="weight" kind="number" label="kg" table="sets" size="sm" /><Field field="reps" kind="number" label="reps" table="sets" size="sm" /><Text size="sm" emphasis="quiet">$row.volume kg</Text></Row>`

export const WORKOUT = `<Sheet title="Session 34 · Pull" icon="target" theme="aizome" feel="board" tags={['workout']} state={{ local: { rest: 120 } }} wsx="1">
  <Row align="center"><Chip>session 34</Chip><Text emphasis="quiet" size="sm">Thursday, heavy</Text></Row>
  <Row>
    <Stat label="kg volume" expr="sum(sets.volume where done = true)" hint="done sets" />
    <Stat label="sets" expr="count(sets where done = true)" hint="of 8" />
    <Stat label="rest preset" expr="rest" hint="seconds" />
  </Row>
  <Missing kind="Timer" reason="rest countdown — ticking a set starts it; the only primitive that advances without a user event" />
  <Section title="Weighted pull-up · best 32 kg">
    <Repeat bind={{ table: 'sets', where: [{ column: 'exercise', op: 'eq', value: 'Weighted pull-up' }], orderBy: { column: 'set_no', direction: 'asc' } }}>${SET_ROW}</Repeat>
  </Section>
  <Section title="Barbell row · best 95 kg">
    <Repeat bind={{ table: 'sets', where: [{ column: 'exercise', op: 'eq', value: 'Barbell row' }], orderBy: { column: 'set_no', direction: 'asc' } }}>${SET_ROW}</Repeat>
  </Section>
  <Section title="Face pull · best 32 kg">
    <Repeat bind={{ table: 'sets', where: [{ column: 'exercise', op: 'eq', value: 'Face pull' }], orderBy: { column: 'set_no', direction: 'asc' } }}>${SET_ROW}</Repeat>
  </Section>
  <Show expr="max(sets.weight where exercise = 'Weighted pull-up' and done = true) >= 32">
    <Callout tone="success" title="New PR">Weighted pull-up matched or beat 32 kg this session.</Callout>
  </Show>
  <Section title="Volume by session"><Chart bind={{ table: 'sessions' }} kind="line" /></Section>
  <Section title="Rest preset">
    <Slider state="rest" min={60} max={240} step={30} label="Rest between sets" />
    <Text size="sm" emphasis="quiet">Volume is stored per set; editing a weight updates the row, the total follows on the next read.</Text>
  </Section>
  <Button action={{ verb: 'sheet.create', title: 'Session 35 · Push' }}>Finish session</Button>
</Sheet>
`

const BOOK_ROW = `<Card>
        <Row align="center">
          <Badge>$row.kind</Badge>
          <Stack gap="tight" class="grow"><Text emphasis="strong">$row.title</Text><Text size="sm" emphasis="quiet">$row.author · $row.topic · $row.year</Text></Stack>
          <Text size="sm">★ $row.rating</Text>
          <Text size="sm" emphasis="quiet">$row.notes notes</Text>
        </Row>
        <Row align="center"><Progress expr="$row.progress / 100" class="grow" /><Field field="progress" kind="number" label="%" table="books" size="sm" /></Row>
      </Card>`

export const LIBRARY = `<Sheet title="Reading room" icon="book" theme="sumi" tags={['library']} state={{ local: { shelf: 'All' } }} wsx="1">
  <Hero title="Reading room" subtitle="One Filter scope should feed the list, both stats and the chart. Until it lands, each shelf carries its own bind — that is the bug Filter exists to remove." size="md" />
  <Missing kind="Filter" reason="segments · search across title and author · topic facets with counts · three sorts — one scope, no bind repeated" />
  <Row>
    <Stat label="avg rating" expr="avg(books.rating)" />
    <Stat label="notes" expr="sum(books.notes)" />
    <Stat label="finished" expr="count(books where status = 'finished')" hint="of 8" />
  </Row>
  <Tabs labels={['All', 'Reading', 'Finished', 'Queued']} state="shelf">
    <Tab><Repeat bind={{ table: 'books', orderBy: { column: 'rating', direction: 'desc' } }}>${BOOK_ROW}</Repeat></Tab>
    <Tab><Repeat bind={{ table: 'books', where: [{ column: 'status', op: 'eq', value: 'reading' }] }} empty="Nothing on the go.">${BOOK_ROW}</Repeat></Tab>
    <Tab><Repeat bind={{ table: 'books', where: [{ column: 'status', op: 'eq', value: 'finished' }], orderBy: { column: 'rating', direction: 'desc' } }}>${BOOK_ROW}</Repeat></Tab>
    <Tab><Repeat bind={{ table: 'books', where: [{ column: 'status', op: 'eq', value: 'queued' }] }} empty="The queue is empty.">${BOOK_ROW}</Repeat></Tab>
  </Tabs>
  <Grid>
    <Card span={6} title="By topic"><Chart bind={{ table: 'books', groupBy: { column: 'topic', aggregates: [{ fn: 'count' }] } }} kind="donut" /></Card>
    <Card span={6} title="Finished per month"><Chart bind={{ table: 'books', where: [{ column: 'finished_month', op: 'ne', value: '' }], groupBy: { column: 'finished_month', aggregates: [{ fn: 'count' }] } }} kind="bar" /></Card>
  </Grid>
</Sheet>
`
