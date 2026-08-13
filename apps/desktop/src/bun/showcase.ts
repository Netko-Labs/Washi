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

const DASHBOARD = `<Sheet title="Launch Dashboard" icon="📊" theme={{ preset: 'midnight' }}>
  <Tape>live data</Tape>
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

const EDITORIAL = `<Sheet title="On Paper" icon="🖋️" theme={{ preset: 'broadsheet' }}>
  <Hero size="lg" title="On Paper" subtitle="Why the oldest interface still wins — a short essay on washi, wabi-sabi, and software." />
  <P>Handmade paper survives because it holds exactly what is placed on it — no more, no less. A sheet does not interpret. It does not execute. It carries.</P>
  <Quote>The paper is not the message. The paper is the promise that the message stays.</Quote>
  <P>Software forgot this. Documents became programs, and programs became risks. WSX is a return: structure without execution, richness without runtime.</P>
  <Divider />
  <P><Tag>essay</Tag> <Tag>design</Tag> <Stamp label="読" tone="ink" /></P>
</Sheet>
`

const PLAYBOOK = `<Sheet title="Release Playbook" icon="🚀" theme={{ preset: 'sticker' }}>
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

const OPS_LOG = `<Sheet title="Ops Log" icon="🖥️" theme={{ preset: 'terminal' }}>
  <Tape>uptime 99.98%</Tape>
  <Hero title="Ops Log" subtitle="incident notes and runbook fragments. green means calm." />
  <Code lang="bash">$ washi doctor --all
  storage ......... ok (wal, 3ms)
  loro snapshots .. ok (12 docs)
  mcp loopback .... refused (as designed)</Code>
  <Callout tone="success">No open incidents. Last page: 2026-08-02, resolved in 41m.</Callout>
  <H3>Standing checks</H3>
  <TaskList>
    <Task done>rotate tsuru allowlist quarterly</Task>
    <Task done>verify oplog compaction</Task>
    <Task>chaos-test approval timeout path</Task>
  </TaskList>
  <Divider />
  <P>Rule one: roll back beats hotfix. Rule two: see rule one.</P>
</Sheet>
`

const SYSTEM_MAP = `<Sheet title="System Map" icon="📐" theme={{ preset: 'blueprint' }}>
  <Tape>rev C</Tape>
  <Hero title="System Map" subtitle="Washi's process topology, as a field drawing." />
  <Columns>
    <Column><Card title="CEF renderer"><P>React UI · paper components · WSX render</P></Card></Column>
    <Column><Card title="Bun worker"><P>router · services · sqlite · agent host</P></Card></Column>
  </Columns>
  <Timeline>
    <Step marker="RPC" title="typed loopback websocket">token-gated, one router, ctx carries the window</Step>
    <Step marker="MCP" title="in-process tools">sheet_*, db_*, tsuru fetch, hanko actions</Step>
    <Step marker="SYNC" title="future: loro + oplog relay">server is a durable relay, never a merge brain</Step>
  </Timeline>
  <Callout tone="info">Every line on this sheet is data. The map cannot execute the territory.</Callout>
</Sheet>
`

const MOODBOARD = `<Sheet title="Neon Moodboard" icon="🌃" class="bg-[#0b0b12] text-[#ecebff] px-0 py-0">
  <Box class="bg-gradient-to-br from-fuchsia-600 via-purple-700 to-indigo-900 px-10 pt-14 pb-12">
    <Span class="font-mono text-[11px] uppercase tracking-[0.35em] text-fuchsia-200">wsx · unrestricted</Span>
    <Box class="mt-3 font-display text-5xl font-bold leading-none">Design like it's a website</Box>
    <Box class="mt-4 max-w-md text-fuchsia-100/80">This sheet uses no preset — every surface below is raw Tailwind written by hand (or by an agent).</Box>
  </Box>
  <Box class="grid grid-cols-3 gap-3 px-10 -mt-6">
    <Box class="rounded-2xl bg-[#17172a] p-5 shadow-[0_20px_60px_#000a] hover:-translate-y-1 transition-transform">
      <Box class="text-3xl font-bold text-fuchsia-400">92%</Box>
      <Box class="mt-1 text-xs text-[#8b8aa8]">of this card is vibes</Box>
    </Box>
    <Box class="rounded-2xl bg-[#17172a] p-5 shadow-[0_20px_60px_#000a] hover:-translate-y-1 transition-transform">
      <Box class="text-3xl font-bold text-cyan-300">0</Box>
      <Box class="mt-1 text-xs text-[#8b8aa8]">lines of executable code</Box>
    </Box>
    <Box class="rounded-2xl bg-[#17172a] p-5 shadow-[0_20px_60px_#000a] hover:-translate-y-1 transition-transform">
      <Box class="text-3xl font-bold text-amber-300">∞</Box>
      <Box class="mt-1 text-xs text-[#8b8aa8]">aesthetics per vault</Box>
    </Box>
  </Box>
  <Box class="px-10 py-8">
    <Box class="flex items-center gap-3">
      <Span class="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-500/60 to-transparent" />
      <Span class="font-mono text-[10px] uppercase tracking-widest text-[#8b8aa8]">still just data</Span>
      <Span class="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-500/60 to-transparent" />
    </Box>
    <Box class="mt-6 rounded-xl border border-fuchsia-500/20 bg-[#12121f] p-5 text-sm leading-relaxed text-[#c9c7e8]">
      Ask the agent for brutalist, or pastel, or corporate-memphis — the grammar carries it.
      Validation still rejects anything executable, and url() never ships.
    </Box>
  </Box>
</Sheet>
`

const INTERACTIVE = `<Sheet title="Interactive Kit" icon="🎛️" theme={{ preset: 'washi', accent: 'violet' }} state={{ view: 'controls', details: false, budget: 40 }}>
  <Tape color="violet">stateful · still data</Tape>
  <Hero title="Interactive Kit" subtitle="Hook-shaped interactivity with zero executable content: controls write to sheet state, Show reads it." />
  <Tabs labels={['controls', 'feedback', 'overlay']} state="view">
    <Tab>
      <Switch state="details" label="Show the fine print" />
      <Show when="details">
        <Callout tone="info">This paragraph exists because a switch flipped a state key — no handlers were written.</Callout>
      </Show>
      <Slider state="budget" min={0} max={100} step={5} label="Budget burn" />
      <Show when="details">
        <P class="text-xs text-muted-foreground">State keys: view · details · budget. All declared on the Sheet, all plain scalars.</P>
      </Show>
    </Tab>
    <Tab>
      <P>Status chips: <Badge>shipped</Badge> <Badge tone="outline">review</Badge> <Badge tone="destructive">blocked</Badge></P>
      <P>Owners: <Avatar label="Juan Vasquez" /> <Avatar label="Washi Agent" /> <Tooltip label="hover works too"><Span class="underline decoration-dotted">hover me</Span></Tooltip></P>
      <Progress value={62} />
      <Skeleton class="w-1/2" />
      <P>Shortcuts: <Kbd>⌘K</Kbd> <Kbd>⌘Enter</Kbd></P>
    </Tab>
    <Tab>
      <Dialog trigger="Open a dialog" title="Native, sandboxed, boring">
        <P>Even this modal is declarative — a trigger label and children. The sheet never sees an event handler.</P>
      </Dialog>
      <Accordion>
        <AccordionItem title="Why no hooks?">
          <P>Hooks are code. Sheets are paper. A prompt-injected agent should never be able to make paper execute.</P>
        </AccordionItem>
        <AccordionItem title="What if I need real logic?">
          <P>Bind data with ink, trigger verbs with hanko, or ask the spec for Q11: sandboxed expressions.</P>
        </AccordionItem>
      </Accordion>
    </Tab>
  </Tabs>
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
    { title: 'Ops Log', icon: '🖥️', source: OPS_LOG },
    { title: 'System Map', icon: '📐', source: SYSTEM_MAP },
    { title: 'Neon Moodboard', icon: '🌃', source: MOODBOARD },
    { title: 'Interactive Kit', icon: '🎛️', source: INTERACTIVE },
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
