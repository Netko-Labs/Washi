/** The six notes: one per feel, several themes, every primitive group. */

export const WELCOME = `<Sheet title="Welcome to Washi" icon="sparkles" wsx="1">
  <Row align="center"><Tape>washi</Tape><Mascot mood="happy" size="sm" /></Row>
  <Hero title="Notes agents can design." subtitle="Sheets are WSX — a closed component format an agent writes and Washi renders. Components own appearance; pages own content and meaning. Nothing in a page executes." />
  <Row>
    <Chip>wsx</Chip>
    <Chip tone="info">ink tables</Chip>
    <Chip tone="success">embedded claude</Chip>
    <Chip tone="warning">local-first</Chip>
  </Row>
  <Callout tone="info" title="Try it">Open the agent panel and ask for a sheet. Try: "make me a reading tracker".</Callout>
  <Reveal label="What can a sheet contain?">
    <Text>Frame, text, surfaces, live data in and out, flow, and the washi kit — every block validated, none of it code. A page picks from four enums; it never names a colour, a font or a margin.</Text>
  </Reveal>
  <Divider />
  <Text emphasis="quiet">Every sheet in the sidebar is a different feel and theme. Same registry, no utility classes.</Text>
</Sheet>
`

export const DASHBOARD = `<Sheet title="Launch Dashboard" icon="rocket" feel="board" theme="aizome" wsx="1">
  <Hero title="Launch Dashboard" subtitle="Bound to the launch_tasks table. Edit the data and the sheet follows." size="md" />
  <Grid>
    <Card span={4}><Stat label="open tasks" expr="count(launch_tasks where done = false)" hint="count · not done" /></Card>
    <Card span={4}><Stat label="shipped" expr="count(launch_tasks where status = 'shipped')" trend="up" /></Card>
    <Card span={4}><Stat label="story points" expr="sum(launch_tasks.points)" hint="sum(points)" /></Card>
  </Grid>
  <Progress expr="count(launch_tasks where done = true) / count(launch_tasks)" label="done" />
  <Section title="By status">
    <Board bind={{ table: 'launch_tasks' }} groupBy="status" />
  </Section>
  <Section title="Points by status">
    <Chart bind={{ table: 'launch_tasks', groupBy: { column: 'status', aggregates: [{ fn: 'sum', column: 'points' }] } }} kind="bar" />
  </Section>
  <Section title="All tasks">
    <Table bind={{ table: 'launch_tasks', orderBy: { column: 'points', direction: 'desc' } }} columns={['title', 'status', 'points', 'done']} />
    <Row>
      <Button action={{ verb: 'table.insert', table: 'launch_tasks', data: { title: 'New task', status: 'todo', points: 1, done: false } }}>Add task</Button>
      <Button variant="outline" tone="neutral" action={{ verb: 'sheet.create', title: 'Release notes' }}>Draft release notes</Button>
    </Row>
  </Section>
</Sheet>
`

export const TRIP = `<Sheet title="Kyoto in October" icon="plane" theme="kraft" state={{ local: { budget: 150000 } }} wsx="1">
  <Hero title="Kyoto in October" subtitle="Three nights, one ryokan, no plans before ten." />
  <Grid>
    <Card span={5} title="Budget">
      <Stat label="planned" expr="72000 + 26100 + 31000 + 9800 + 4400" hint="five lines, one sum" />
      <Progress expr="(72000 + 26100 + 31000 + 9800 + 4400) / budget" label="of budget" />
      <Slider state="budget" min={100000} max={200000} step={5000} label="Budget" />
    </Card>
    <Card span={7} title="Costs">
      <Pair term="Ryokan, three nights"><Money value={72000} currency="JPY" /></Pair>
      <Pair term="Shinkansen, return"><Money value={26100} currency="JPY" /></Pair>
      <Pair term="Meals"><Money value={31000} currency="JPY" /></Pair>
      <Pair term="Onsen and museums"><Money value={9800} currency="JPY" /></Pair>
      <Pair term="Local transport"><Money value={4400} currency="JPY" /></Pair>
    </Card>
  </Grid>
  <Show expr="72000 + 26100 + 31000 + 9800 + 4400 > budget">
    <Callout tone="warning" title="Over budget">Trim a museum or two, or move the slider.</Callout>
  </Show>
  <Section title="Itinerary">
    <Timeline>
      <Step marker="D1" title="Arrive">Shinkansen from Tokyo, check in, walk Gion at dusk.</Step>
      <Step marker="D2" title="Arashiyama" tone="info">Bamboo grove before eight, then the river.</Step>
      <Step marker="D3" title="Onsen day" tone="success">Kurama to Kibune on foot. Rotenburo after.</Step>
      <Step marker="D4" title="Home" tone="neutral">Late train. Nothing planned.</Step>
    </Timeline>
  </Section>
  <Section title="Packing">
    <List marker="check">
      <Item done>Passport and IC card</Item>
      <Item done>Rain shell</Item>
      <Item>Swimsuit for the rotenburo</Item>
      <Item>Notebook and pen</Item>
    </List>
  </Section>
</Sheet>
`

export const ESSAY = `<Sheet title="On Paper" icon="pen" feel="editorial" theme="sumi" wsx="1">
  <Row align="center"><Tag>essay</Tag><Tag>004</Tag></Row>
  <Title>On Paper</Title>
  <Text lead>Handmade paper survives because it holds exactly what is placed on it — no more, no less. A sheet does not interpret. It does not execute. It carries.</Text>
  <Quote>The paper is not the message. The paper is the promise that the message stays.</Quote>
  <Text>Software forgot this. Documents became programs, and programs became risks. WSX is a return: structure without execution, richness without runtime.<Mark>Nothing in a page executes.</Mark></Text>
  <Section title="Terms">
    <Pair term="Registry">The closed set of primitives a page may use. A missing capability is a request, not a workaround.</Pair>
    <Pair term="Feel">Four designed proportions — note, editorial, board, deck — instead of infinite undesigned ones.</Pair>
    <Pair term="Tone">Meaning, as a pre-checked colour triplet. Contrast cannot fail because a page never picks.</Pair>
  </Section>
  <Reveal label="Why no utility classes?">
    <Text>Every default an agent has to fight is a default it will fight badly. Take the surface away and the sameness that remains is the house style, on purpose.</Text>
  </Reveal>
  <Note>Draft 0.4 of the page format, generated against the live registry.</Note>
  <Source>Washi design handoff, September 2026</Source>
</Sheet>
`

export const POSTMORTEM = `<Sheet title="Postmortem: stored keys" icon="flag" feel="editorial" theme="kobai" wsx="1">
  <Row align="center"><Stamp label="done" /><Tape tone="danger">incident</Tape></Row>
  <Title>A rename garbage-collected stored state on 41 sheets</Title>
  <Text lead>No data was lost for good — the action log had every write — but 41 readers opened a page that had forgotten their filters.</Text>
  <Grid>
    <Card span={4} variant="filled" tone="danger"><Stat label="sheets affected" value={41} /></Card>
    <Card span={4} variant="filled" tone="warning"><Stat label="minutes to revert" value={18} /></Card>
    <Card span={4} variant="filled" tone="success"><Stat label="records lost" value={0} /></Card>
  </Grid>
  <Section title="Timeline">
    <Timeline>
      <Step marker="09:12" title="Deploy" tone="neutral">Key rename ships without a migration.</Step>
      <Step marker="09:40" title="First report" tone="warning">"My board forgot it was filtered to mine."</Step>
      <Step marker="09:58" title="Revert" tone="danger">One-click revert from the action log, per sheet.</Step>
      <Step marker="11:30" title="Rule" tone="success">Stored keys are additive; removal renders as a diff the user confirms.</Step>
    </Timeline>
  </Section>
  <Callout tone="danger" title="Root cause">The validator treated an orphaned stored key as garbage instead of as history.</Callout>
  <Section title="Actions">
    <List marker="check">
      <Item done>Key removal requires a confirmed diff</Item>
      <Item done>Orphaned values kept for one version</Item>
      <Item>Migration dry-run in the publish dialog</Item>
      <Item>Alert on stored-key delete volume</Item>
    </List>
  </Section>
</Sheet>
`

export const RECIPE = `<Sheet title="Country loaf" icon="leaf" theme="matcha" state={{ local: { dough: 900, hydration: 74 } }} wsx="1">
  <Hero title="Country loaf" subtitle="Two sliders, five derived numbers, one honest timeline." size="md" />
  <Grid>
    <Card span={6} title="Dial it in">
      <Slider state="dough" min={500} max={1500} step={50} label="Dough weight (g)" />
      <Slider state="hydration" min={60} max={85} step={1} label="Hydration (%)" />
    </Card>
    <Card span={6} title="Formula">
      <Row>
        <Stat size="sm" label="flour" expr="dough / (1.22 + hydration / 100)" />
        <Stat size="sm" label="water" expr="dough / (1.22 + hydration / 100) * hydration / 100" />
        <Stat size="sm" label="levain" expr="dough / (1.22 + hydration / 100) * 0.2" />
        <Stat size="sm" label="salt" expr="dough / (1.22 + hydration / 100) * 0.02" />
      </Row>
    </Card>
  </Grid>
  <Show expr="hydration >= 80"><Callout tone="warning" title="Wet dough">Above 80% the shaping window is short. Coil folds, not stretch and folds.</Callout></Show>
  <Show expr="hydration < 80"><Callout tone="success" title="Comfortable">Standard stretch and folds every 30 minutes for the first two hours.</Callout></Show>
  <Section title="Method">
    <List marker="number">
      <Item>Autolyse flour and water for 30 minutes.</Item>
      <Item>Add levain and salt; pinch and fold until smooth.</Item>
      <Item>Bulk ferment 5 hours at 22°C with folds.</Item>
      <Item>Shape, then cold proof overnight.</Item>
      <Item>Bake covered at 250°C for 20 minutes, uncovered for 25.</Item>
    </List>
  </Section>
  <Code lang="text">flour = dough / (1.22 + hydration)
water = flour × hydration</Code>
</Sheet>
`
