/** Every primitive, once, in the house style (WSX Primitives.dc.html). `welcome` is a sheet id for Ref. */
export const primitivesSheet = (
  welcome: string,
) => `<Sheet title="WSX Primitives" icon="sparkles" tags={['wsx', 'registry']} state={{ local: { tab: 'board', fine: false, points: 5 } }} wsx="1">
  <Row align="center"><Chip>registry</Chip><Text emphasis="quiet" size="sm">54 primitives · house style · no utilities</Text></Row>
  <Hero title="Every primitive, once." subtitle="Each block is the rendered primitive plus the line that produced it. Nothing here names a colour, a size in px or a margin." />

  <Section title="00 · Foundations">
    <Text emphasis="quiet" size="sm">Tone — six meanings, pre-checked contrast</Text>
    <Row><Chip>neutral</Chip><Chip tone="accent">accent</Chip><Chip tone="info">info</Chip><Chip tone="success">success</Chip><Chip tone="warning">warning</Chip><Chip tone="danger">danger</Chip></Row>
    <Text emphasis="quiet" size="sm">Type — role, not size</Text>
    <Title level={1}>Title 1 — Young Serif</Title>
    <Title level={2}>Title 2 — Young Serif</Title>
    <Title level={3}>Title 3 — Karla bold</Title>
    <Text>Text md — the reading default, Karla 400.</Text>
    <Text size="sm" emphasis="quiet">Text sm quiet — supporting detail.</Text>
  </Section>

  <Section title="01 · Frame — Sheet · Section · Row · Stack · Grid · Divider">
    <Text emphasis="quiet" size="sm">Grid · span 6 / 6 / 4 / 8</Text>
    <Grid>
      <Card span={6} variant="outline"><Text size="sm">span 6</Text></Card>
      <Card span={6} variant="outline"><Text size="sm">span 6</Text></Card>
      <Card span={4} variant="filled"><Text size="sm">span 4</Text></Card>
      <Card span={8} variant="filled"><Text size="sm">span 8</Text></Card>
    </Grid>
    <Row><Tag>Row</Tag><Tag>item</Tag><Tag>wraps</Tag><Tag>by</Tag><Tag>default</Tag></Row>
    <Stack gap="tight"><Text size="sm">Stack — child gap owned by the parent</Text><Text size="sm">Second line, same rhythm</Text></Stack>
    <Divider />
    <Divider emphasis="strong" />
  </Section>

  <Section title="02 · Text — 10 block · 4 inline">
    <Text>A Text with <Mark>Mark on a phrase</Mark>, a <Ref sheet="${welcome}">Ref to another sheet</Ref>, a <Kbd>⌘J</Kbd> Kbd and a <Tag>Tag</Tag>.</Text>
    <Quote>Quote — the format is the argument.</Quote>
    <List marker="bullet"><Item>List with marker bullet</Item><Item>Item two, same rhythm</Item></List>
    <List marker="number"><Item>Numbered list</Item><Item>Second step</Item></List>
    <List marker="check"><Item done>Done item</Item><Item>Open item</Item></List>
    <Code lang="json">{'{ "ok": true }'}</Code>
    <Pair term="Pair">Term and definition — the spec-table workhorse.</Pair>
    <Note>Note — auto-numbered footnote.</Note>
    <Source>Source — washi.md, 2026</Source>
    <Text emphasis="quiet" size="sm">Emphasis × tone — seven looks, zero colour values in the page</Text>
    <Grid gap="tight">
      <Text span={4} emphasis="quiet">quiet · neutral — supporting detail</Text>
      <Text span={4}>normal · neutral — the body default</Text>
      <Text span={4} emphasis="strong">strong · neutral — the point</Text>
      <Text span={4} emphasis="strong" tone="accent">strong · accent — one per view</Text>
      <Text span={4} tone="info">normal · info</Text>
      <Text span={4} tone="success">normal · success</Text>
      <Text span={4} tone="warning">normal · warning</Text>
      <Text span={4} tone="danger">normal · danger</Text>
    </Grid>
  </Section>

  <Section title="03 · Surface — Card · Callout · Hero · Figure">
    <Grid>
      <Card span={6} variant="plain" title="Plain"><Text size="sm">No surface at all — grouping only.</Text></Card>
      <Card span={6} variant="outline" title="Outline"><Text size="sm">Hairline border, the default.</Text></Card>
      <Card span={6} variant="filled" title="Filled"><Text size="sm">Tinted paper, no border.</Text></Card>
      <Card span={6} variant="raised" title="Raised"><Text size="sm">For things that float.</Text></Card>
      <Card span={12} variant="tape" title="tape"><Text size="sm">The washi variant — a torn label on the corner.</Text></Card>
    </Grid>
    <Callout tone="info">Binds refresh on open.</Callout>
    <Callout tone="success">Board is clear.</Callout>
    <Callout tone="warning">Sync is paused.</Callout>
    <Callout tone="danger" title="That column no longer exists">The bind names a column the table lost.</Callout>
    <Hero title="Q3 board" subtitle="Drag to move. Changes save." size="md" />
    <Figure src="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=70" alt="Mountains under a night sky" caption="Caption sits with the image, never floats. Aspect is held before the bytes arrive." ratio="16:9" />
  </Section>

  <Section title="04 · Data out — Repeat · Table · Stat · Chart · Timeline · Step · Progress · Badge · Avatar">
    <Grid>
      <Card span={4}><Stat label="story points" expr="sum(tasks.points)" hint="sum(points)" /></Card>
      <Card span={4}><Stat label="done" expr="count(tasks where status = 'done')" trend="up" hint="expr · trend" /></Card>
      <Card span={4}><Stat label="in flight" expr="count(tasks where status = 'doing')" trend="flat" /></Card>
    </Grid>
    <Progress expr="count(tasks where status = 'done') / count(tasks)" label="done / total" />
    <Row>
      <Progress value={0.4} tone="success" label="success" class="grow" />
      <Progress value={0.6} tone="warning" label="warning" class="grow" />
      <Progress value={0.8} tone="danger" label="danger" class="grow" />
    </Row>
    <Table bind={{ table: 'tasks', limit: 4 }} columns={['title', 'status', 'assignee']} />
    <Chart bind={{ table: 'tasks', groupBy: { column: 'status', aggregates: [{ fn: 'sum', column: 'points' }] } }} kind="bar" />
    <Timeline>
      <Step marker="1" title="Capture">A note starts as one line.</Step>
      <Step marker="2" title="Fold" tone="info">Washi tags and links it.</Step>
      <Step marker="3" title="Recall" tone="success">It comes back when needed.</Step>
    </Timeline>
    <Text emphasis="quiet" size="sm">Repeat · bind — any custom list without a new component</Text>
    <Repeat bind={{ table: 'tasks', limit: 3 }}>
      <Row align="center"><Text class="grow">$row.title</Text><Badge>$row.status</Badge><Avatar label="$row.assignee" size="sm" /></Row>
    </Repeat>
  </Section>

  <Section title="05 · Data in — Field · Board · Button · Task · Switch · Slider">
    <Text emphasis="quiet" size="sm">Field · one primitive, five column types — bound to the first task</Text>
    <Repeat bind={{ table: 'tasks', limit: 1 }}>
      <Card title="$row.title">
        <Grid gap="tight">
          <Field span={6} field="title" kind="text" label="Title" table="tasks" />
          <Field span={3} field="points" kind="number" label="Points" table="tasks" help="number column, live" />
          <Field span={3} field="due" kind="date" label="Due" table="tasks" />
          <Field span={6} field="status" kind="select" label="Status" table="tasks" help="todo · doing · review · done" />
          <Field span={6} field="blocked" kind="boolean" label="Blocked" table="tasks" />
        </Grid>
      </Card>
    </Repeat>
    <Text emphasis="quiet" size="sm">Button · variant × size — each carries an action object, never a handler</Text>
    <Row align="center">
      <Button action={{ verb: 'table.insert', table: 'tasks', data: { title: 'New task', status: 'todo', priority: 'medium', assignee: 'Peje', due: '2026-09-30', points: 1, blocked: false, labels: '', done: false } }}>Add task</Button>
      <Button variant="outline" action={{ verb: 'sheet.open', sheet: '${welcome}' }}>Outline</Button>
      <Button variant="filled" tone="neutral" action={{ verb: 'sheet.open', sheet: '${welcome}' }}>Secondary</Button>
      <Button variant="plain" action={{ verb: 'sheet.open', sheet: '${welcome}' }}>Ghost</Button>
      <Button tone="danger" action={{ verb: 'sheet.open', sheet: '${welcome}' }}>Delete</Button>
      <Button size="sm" action={{ verb: 'sheet.open', sheet: '${welcome}' }}>sm</Button>
      <Button size="lg" action={{ verb: 'sheet.open', sheet: '${welcome}' }}>lg</Button>
    </Row>
    <Text emphasis="quiet" size="sm">Task · writes a row</Text>
    <Repeat bind={{ table: 'tasks', where: [{ column: 'status', op: 'in', value: ['doing', 'review'] }] }}>
      <Task>$row.title</Task>
    </Repeat>
    <Text emphasis="quiet" size="sm">Board · bind + groupBy — drag lands with table.reorder</Text>
    <Board bind={{ table: 'tasks' }} groupBy="status" groups={['todo', 'doing', 'review', 'done']} badge="priority" meta="points" avatar="assignee" />
  </Section>

  <Section title="06 · Flow — Show · Tabs · Tab · Reveal · Switch · Slider">
    <Tabs labels={['board', 'notes']} state="tab">
      <Tab><Text>Panel one — a Tab per label, state optional.</Text></Tab>
      <Tab><Text>Panel two — same tree, no page-level layout.</Text></Tab>
    </Tabs>
    <Switch state="fine" label="Show the fine print" />
    <Show expr="fine = true"><Callout tone="info">Appears because Show read a state key — no handler, no expression in the markup beyond expr.</Callout></Show>
    <Slider state="points" min={0} max={13} step={1} label="Points" />
    <Show expr="points >= 8"><Text tone="warning" emphasis="strong">Big story — consider splitting.</Text></Show>
    <Reveal label="Reveal — disclosure"><Text size="sm">Hidden until asked. Optional state key remembers it.</Text></Reveal>
    <Missing kind="Scene" reason="Scene · Beat · Stepper — ordered beats with one integer of state, autoplay optional" />
  </Section>

  <Section title="07 · Query — Filter · Facet · Search · Sort · Segment">
    <Text size="sm">A scope, not a control: every bind inside inherits it, so a Stat and a list can never disagree.</Text>
    <Missing kind="Filter" reason="one scope with Facet (options from the column), Search, Sort and Segment presets — stored per reader" />
  </Section>

  <Section title="08 · New in 0.4 — Calendar · Matrix · Timer · Money">
    <Missing kind="Calendar" reason="rows placed by date; dragging a row to another day is table.update on the date column" />
    <Missing kind="Matrix" reason="bound grid with axis semantics — counts as one node against the budget" />
    <Missing kind="Timer" reason="countdown or elapsed; the only primitive that advances without a user event" />
    <Text emphasis="quiet" size="sm">Money · same value, vault locale — pages compute the number, never the string</Text>
    <Row><Money value={1234.5} currency="USD" /><Money value={1234.5} currency="EUR" /><Money value={123450} currency="JPY" /><Money value={-42} currency="GBP" /><Money expr="sum(tasks.points) * 12.5" currency="CHF" /></Row>
  </Section>

  <Section title="09 · Washi kit — Chip · Mascot">
    <Row align="center"><Chip>chip</Chip><Chip tone="success">shipped</Chip><Chip tone="warning">in review</Chip><Mascot mood="wink" size="sm" /></Row>
    <Text size="sm" emphasis="quiet">The only decorative primitives. They take tone from the sheet accent, so a page cannot assemble a rainbow. One mascot per page.</Text>
  </Section>
</Sheet>
`
