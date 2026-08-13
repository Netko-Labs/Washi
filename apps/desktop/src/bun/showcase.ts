import { getSheet, getTableByName, listSheets } from '@washi/desktop-repository'
import {
  createSheetFromSource,
  defineUserTable,
  runMutation,
  updateSheetFromSource,
} from '@washi/desktop-service'

/**
 * Seeded showcase sheets — one per design direction, proving WSX carries a
 * visual identity the way docs/spec.html does. Idempotent by title.
 */

const WELCOME = `<Sheet title="Welcome to Washi" icon="📜" theme={{ accent: 'pink' }}>
  <Tape>washi</Tape>
  <Hero title="Notes agents can design" subtitle="Sheets are WSX — JSX-shaped data rendered by a closed registry. Agents write them; you direct. Nothing in a sheet can execute." />
  <P><Chip color="pink">wsx</Chip><Chip color="teal">ink tables</Chip><Chip color="violet">embedded claude</Chip><Chip color="mustard">local-first</Chip></P>
  <Callout tone="info">Open the agent panel and ask for a sheet. Try: "make me a reading tracker".</Callout>
  <Toggle label="What can a sheet contain?">
    <P>Heroes, callouts, tasks, live tables, boards, stats, timelines, tape and stamps — every block validated, none of it code.</P>
  </Toggle>
  <Divider />
  <P>Browse the other sheets in the sidebar — each one is a different design direction, all plain WSX.</P>
</Sheet>
`

const DASHBOARD = `<Sheet title="Launch Dashboard" icon="📊" theme={{ accent: 'teal', paper: 'plain' }}>
  <Tape color="teal">live data</Tape>
  <Hero title="Launch Dashboard" subtitle="Stats and views bound to the launch_tasks table with ink — edit the data and the sheet follows." />
  <Columns>
    <Column><Stat value="7" label="open tasks" hint="db_query · count" /></Column>
    <Column><Stat value="3" label="shipped" hint="status = shipped" /></Column>
    <Column><Stat value="21" label="story points" hint="sum(points)" /></Column>
  </Columns>
  <H3>By status</H3>
  <Board bind={{ table: 'launch_tasks' }} groupBy="status" />
  <H3>All tasks</H3>
  <Table bind={{ table: 'launch_tasks', orderBy: { column: 'points', direction: 'desc' } }} columns={['title', 'status', 'points']} />
</Sheet>
`

const EDITORIAL = `<Sheet title="On Paper" icon="🖋️" theme={{ accent: 'moss', face: 'serif', paper: 'lines' }}>
  <Hero size="lg" title="On Paper" subtitle="Why the oldest interface still wins — a short essay on washi, wabi-sabi, and software." />
  <P>Handmade paper survives because it holds exactly what is placed on it — no more, no less. A sheet does not interpret. It does not execute. It carries.</P>
  <Quote>The paper is not the message. The paper is the promise that the message stays.</Quote>
  <P>Software forgot this. Documents became programs, and programs became risks. WSX is a return: structure without execution, richness without runtime.</P>
  <Divider />
  <P><Tag>essay</Tag> <Tag>design</Tag> <Stamp label="読" tone="ink" /></P>
</Sheet>
`

const PLAYBOOK = `<Sheet title="Release Playbook" icon="🚀" theme={{ accent: 'blue', face: 'rounded', paper: 'dots' }}>
  <Hero align="center" title="Release Playbook" subtitle="The path from branch to shipped, as a living checklist." />
  <P class="text-center"><Chip color="blue">repeatable</Chip><Chip color="mustard">low-drama</Chip><Chip color="moss">reversible</Chip></P>
  <Timeline>
    <Step marker="01" title="Freeze" color="slate">Branch, version bump, changelog. No new features past this line.</Step>
    <Step marker="02" title="Verify" color="teal">Tests, typecheck, mirin check. Green or it does not ship.</Step>
    <Step marker="03" title="Ship" color="blue">Tag, build, release artifacts. The updater does the rest.</Step>
    <Step marker="04" title="Watch" color="mustard">First hour on the error stream. Roll back beats hotfix.</Step>
  </Timeline>
  <Columns>
    <Column><Card title="Owner" accent="blue"><P>Whoever cut the branch runs the show.</P></Card></Column>
    <Column><Card title="Rollback" accent="mustard"><P>Previous artifact stays live until the new one survives an hour.</P></Card></Column>
  </Columns>
  <Callout tone="success">Add release tasks to the dashboard with the agent — it writes to the same table.</Callout>
</Sheet>
`

const LAUNCH_TASKS = [
  { title: 'Cut release branch', status: 'shipped', points: 2 },
  { title: 'Bundle CEF locales', status: 'shipped', points: 3 },
  { title: 'Wire updater feed', status: 'shipped', points: 5 },
  { title: 'Notarize macOS build', status: 'doing', points: 5 },
  { title: 'Windows installer pass', status: 'doing', points: 3 },
  { title: 'Write release notes', status: 'todo', points: 1 },
  { title: 'Smoke test on Linux', status: 'todo', points: 2 },
]

export function seedShowcase(): void {
  if (!getTableByName('launch_tasks')) {
    defineUserTable({
      name: 'launch_tasks',
      columns: [
        { name: 'title', type: 'text' },
        { name: 'status', type: 'select', options: ['todo', 'doing', 'shipped'] },
        { name: 'points', type: 'number' },
        { name: 'done', type: 'boolean' },
      ],
    })
    for (const task of LAUNCH_TASKS) {
      runMutation({
        kind: 'insert',
        table: 'launch_tasks',
        data: { ...task, done: task.status === 'shipped' },
      })
    }
  }

  const byTitle = new Map(listSheets().map((sheet) => [sheet.title, sheet.id]))
  const seeds = [
    { title: 'Welcome to Washi', icon: '📜', source: WELCOME },
    { title: 'Launch Dashboard', icon: '📊', source: DASHBOARD },
    { title: 'On Paper', icon: '🖋️', source: EDITORIAL },
    { title: 'Release Playbook', icon: '🚀', source: PLAYBOOK },
  ]
  for (const seed of seeds) {
    const existingId = byTitle.get(seed.title)
    if (!existingId) {
      createSheetFromSource(seed)
    } else if (getSheet(existingId)?.source !== seed.source) {
      // Showcase sheets track the build — refresh them when their source evolves.
      updateSheetFromSource(existingId, seed)
    }
  }
}
