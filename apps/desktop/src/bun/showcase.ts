import { getSheet, getTableByName, listSheets } from '@washi/repository'
import {
  createSheetFromSource,
  defineUserTable,
  runMutation,
  updateSheetFromSource,
} from '@washi/service'

/**
 * Seeded showcase sheets — one per design direction, proving WSX carries a
 * visual identity the way docs/spec.html does. Idempotent by title.
 */

const WELCOME = `<Sheet title="Welcome to Washi" icon="📜" theme={{ accent: 'pink' }} class="min-h-full bg-[#fbf5ea] px-8 py-12 text-[#453325] @md:px-16">
  <Box class="mx-auto max-w-2xl">
    <Tape class="font-bold text-[11px] uppercase tracking-[0.2em]">washi</Tape>
    <H1 class="mt-6 font-display font-black text-5xl leading-[0.95] tracking-tight">Notes agents can design<Span class="text-[#cf6b36]">.</Span></H1>
    <P class="mt-5 max-w-lg text-[17px] leading-relaxed text-[#7a6449]">Sheets are WSX — JSX-shaped data rendered by a closed registry. Agents write them, you direct. Nothing in a sheet can execute.</P>
    <Box class="mt-8 flex flex-wrap gap-2">
      <Chip color="pink" class="rounded-full border border-[#e8dbc2] bg-white/70 px-3 py-1 font-mono text-[11px]">wsx</Chip>
      <Chip color="teal" class="rounded-full border border-[#e8dbc2] bg-white/70 px-3 py-1 font-mono text-[11px]">ink tables</Chip>
      <Chip color="violet" class="rounded-full border border-[#e8dbc2] bg-white/70 px-3 py-1 font-mono text-[11px]">embedded claude</Chip>
      <Chip color="mustard" class="rounded-full border border-[#e8dbc2] bg-white/70 px-3 py-1 font-mono text-[11px]">local-first</Chip>
    </Box>
    <Callout tone="info" class="mt-8 rounded-xl border-[#e8dbc2] bg-white/60 px-5 py-4 text-[15px]">Open the agent panel and ask for a sheet. Try: "make me a reading tracker".</Callout>
    <Toggle label="What can a sheet contain?" class="mt-4 rounded-xl border border-[#e8dbc2] bg-white/40 px-5 py-3 text-[15px]">
      <P class="pt-2 leading-relaxed text-[#7a6449]">Heroes, callouts, tasks, live tables, boards, stats, timelines, tape and stamps — every block validated, none of it code.</P>
    </Toggle>
    <Divider class="my-10 border-[#e8dbc2]" />
    <P class="text-[15px] text-[#7a6449]">Every sheet in the sidebar is a different design direction, all plain WSX — no theme engine, just classes.</P>
  </Box>
</Sheet>
`
const DASHBOARD = `<Sheet title="Launch Dashboard" icon="📊" theme={{ preset: 'midnight' }} class="min-h-full bg-[#12131a] px-8 py-10 text-[#e6e9f2] @md:px-12">
  <Box class="mx-auto max-w-3xl">
    <Span class="font-mono text-[11px] uppercase tracking-[0.3em] text-[#5ec8b8]">live · bound to ink</Span>
    <H1 class="mt-3 font-bold text-4xl tracking-tight">Launch Dashboard</H1>
    <P class="mt-3 max-w-lg text-[#8b93a8] leading-relaxed">Stats and views bound to the launch_tasks table. Edit the data and the sheet follows.</P>
    <Box class="mt-8 grid grid-cols-1 gap-3 @sm:grid-cols-3">
      <Stat value="7" label="open tasks" hint="db_query · count" class="rounded-2xl border border-white/8 bg-white/4 p-5 [&>div:first-child]:font-bold [&>div:first-child]:text-4xl [&>div:nth-child(2)]:mt-1 [&>div:nth-child(2)]:text-[#8b93a8] [&>div:nth-child(2)]:text-xs [&>div:nth-child(2)]:uppercase [&>div:nth-child(2)]:tracking-wider [&>div:last-child]:mt-2 [&>div:last-child]:font-mono [&>div:last-child]:text-[10px] [&>div:last-child]:text-[#5ec8b8]" />
      <Stat value="3" label="shipped" hint="status = shipped" class="rounded-2xl border border-white/8 bg-white/4 p-5 [&>div:first-child]:font-bold [&>div:first-child]:text-4xl [&>div:nth-child(2)]:mt-1 [&>div:nth-child(2)]:text-[#8b93a8] [&>div:nth-child(2)]:text-xs [&>div:nth-child(2)]:uppercase [&>div:nth-child(2)]:tracking-wider [&>div:last-child]:mt-2 [&>div:last-child]:font-mono [&>div:last-child]:text-[10px] [&>div:last-child]:text-[#5ec8b8]" />
      <Stat value="21" label="story points" hint="sum(points)" class="rounded-2xl border border-white/8 bg-white/4 p-5 [&>div:first-child]:font-bold [&>div:first-child]:text-4xl [&>div:nth-child(2)]:mt-1 [&>div:nth-child(2)]:text-[#8b93a8] [&>div:nth-child(2)]:text-xs [&>div:nth-child(2)]:uppercase [&>div:nth-child(2)]:tracking-wider [&>div:last-child]:mt-2 [&>div:last-child]:font-mono [&>div:last-child]:text-[10px] [&>div:last-child]:text-[#5ec8b8]" />
    </Box>
    <H3 class="mt-10 mb-3 font-semibold text-[13px] uppercase tracking-[0.2em] text-[#8b93a8]">By status</H3>
    <Board bind={{ table: 'launch_tasks' }} groupBy="status" class="[&>div>div:first-child]:mb-2 [&>div>div:first-child]:font-mono [&>div>div:first-child]:text-[11px] [&>div>div:first-child]:uppercase [&>div>div:first-child]:tracking-wider [&>div>div:first-child]:text-[#5ec8b8] [&>div>div:not(:first-child)]:mb-2 [&>div>div:not(:first-child)]:rounded-lg [&>div>div:not(:first-child)]:border [&>div>div:not(:first-child)]:border-white/8 [&>div>div:not(:first-child)]:bg-white/4 [&>div>div:not(:first-child)]:p-3 [&>div>div:not(:first-child)]:text-sm" />
    <H3 class="mt-10 mb-3 font-semibold text-[13px] uppercase tracking-[0.2em] text-[#8b93a8]">All tasks</H3>
    <Table bind={{ table: 'launch_tasks', orderBy: { column: 'points', direction: 'desc' } }} columns={['title', 'status', 'points']} class="rounded-xl border border-white/8 [&_td]:border-white/6 [&_td]:border-t [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-sm [&_th]:px-4 [&_th]:py-2.5 [&_th]:font-mono [&_th]:text-[10px] [&_th]:text-[#8b93a8] [&_th]:uppercase [&_th]:tracking-wider" />
  </Box>
</Sheet>
`
const EDITORIAL = `<Sheet title="On Paper" icon="🖋️" theme={{ preset: 'broadsheet' }} class="min-h-full bg-[#f4f1e8] px-8 py-14 font-serif text-[#221e18] @md:px-20">
  <Box class="mx-auto max-w-[34rem]">
    <Span class="font-mono text-[10px] uppercase tracking-[0.4em] text-[#8a1c12]">essay · 004</Span>
    <H1 class="mt-6 font-normal text-[3.4rem] leading-[0.92] tracking-tight">On Paper</H1>
    <P class="mt-6 border-[#c9c0ab] border-t pt-6 text-[19px] leading-[1.75] first-letter:float-left first-letter:mt-1 first-letter:mr-2 first-letter:font-bold first-letter:text-[3.6rem] first-letter:leading-[0.8]">Handmade paper survives because it holds exactly what is placed on it — no more, no less. A sheet does not interpret. It does not execute. It carries.</P>
    <Quote class="my-8 border-[#8a1c12] border-l-2 pl-6 text-[21px] italic leading-snug">The paper is not the message. The paper is the promise that the message stays.</Quote>
    <P class="text-[19px] leading-[1.75]">Software forgot this. Documents became programs, and programs became risks. WSX is a return: structure without execution, richness without runtime.</P>
    <Divider class="my-10 border-[#c9c0ab]" />
    <P class="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-[#6b6152]">
      <Tag class="border border-[#c9c0ab] px-2 py-0.5">essay</Tag>
      <Tag class="border border-[#c9c0ab] px-2 py-0.5">design</Tag>
      <Stamp label="読" tone="ink" class="ml-auto opacity-70" />
    </P>
  </Box>
</Sheet>
`
const PLAYBOOK = `<Sheet title="Release Playbook" icon="🚀" theme={{ preset: 'sticker' }} class="min-h-full bg-[#fff6e9] px-8 py-12 font-rounded text-[#3d2f22] @md:px-14">
  <Box class="mx-auto max-w-2xl">
    <H1 class="text-center font-black text-4xl tracking-tight">Release Playbook</H1>
    <P class="mx-auto mt-3 max-w-md text-center text-[#8a7256] leading-relaxed">The path from branch to shipped, as a living checklist.</P>
    <Box class="mt-6 flex flex-wrap justify-center gap-2">
      <Chip color="blue" class="rounded-full bg-white px-3 py-1.5 font-bold text-xs shadow-[0_2px_0_#e0cdb0]">repeatable</Chip>
      <Chip color="mustard" class="rounded-full bg-white px-3 py-1.5 font-bold text-xs shadow-[0_2px_0_#e0cdb0]">low-drama</Chip>
      <Chip color="moss" class="rounded-full bg-white px-3 py-1.5 font-bold text-xs shadow-[0_2px_0_#e0cdb0]">reversible</Chip>
    </Box>
    <Timeline class="mt-10 space-y-4">
      <Step marker="01" title="Freeze" color="slate" class="items-start rounded-2xl bg-white p-4 shadow-[0_3px_0_#e0cdb0] [&>span]:rounded-lg [&>span]:font-black [&>div>div:first-child]:font-bold [&>div>div:last-child]:mt-0.5 [&>div>div:last-child]:text-[#8a7256] [&>div>div:last-child]:text-sm">Branch, version bump, changelog. No new features past this line.</Step>
      <Step marker="02" title="Verify" color="teal" class="items-start rounded-2xl bg-white p-4 shadow-[0_3px_0_#e0cdb0] [&>span]:rounded-lg [&>span]:font-black [&>div>div:first-child]:font-bold [&>div>div:last-child]:mt-0.5 [&>div>div:last-child]:text-[#8a7256] [&>div>div:last-child]:text-sm">Tests, typecheck, mirin check. Green or it does not ship.</Step>
      <Step marker="03" title="Ship" color="blue" class="items-start rounded-2xl bg-white p-4 shadow-[0_3px_0_#e0cdb0] [&>span]:rounded-lg [&>span]:font-black [&>div>div:first-child]:font-bold [&>div>div:last-child]:mt-0.5 [&>div>div:last-child]:text-[#8a7256] [&>div>div:last-child]:text-sm">Tag, build, release artifacts. The updater does the rest.</Step>
      <Step marker="04" title="Watch" color="mustard" class="items-start rounded-2xl bg-white p-4 shadow-[0_3px_0_#e0cdb0] [&>span]:rounded-lg [&>span]:font-black [&>div>div:first-child]:font-bold [&>div>div:last-child]:mt-0.5 [&>div>div:last-child]:text-[#8a7256] [&>div>div:last-child]:text-sm">First hour on the error stream. Roll back beats hotfix.</Step>
    </Timeline>
    <Columns class="mt-8">
      <Column><Card title="Owner" accent="blue" class="rounded-2xl bg-white p-5 pt-6 shadow-[0_3px_0_#e0cdb0] [&>div:nth-child(2)]:mb-1 [&>div:nth-child(2)]:font-bold [&>span]:rounded-b-md"><P class="text-[#8a7256] text-sm leading-relaxed">Whoever cut the branch runs the show.</P></Card></Column>
      <Column><Card title="Rollback" accent="mustard" class="rounded-2xl bg-white p-5 pt-6 shadow-[0_3px_0_#e0cdb0] [&>div:nth-child(2)]:mb-1 [&>div:nth-child(2)]:font-bold [&>span]:rounded-b-md"><P class="text-[#8a7256] text-sm leading-relaxed">Previous artifact stays live until the new one survives an hour.</P></Card></Column>
    </Columns>
    <Callout tone="success" class="mt-6 rounded-2xl border-0 bg-[#dff3dc] px-5 py-4 font-medium text-sm">Add release tasks to the dashboard with the agent — it writes to the same table.</Callout>
  </Box>
</Sheet>
`
const OPS_LOG = `<Sheet title="Ops Log" icon="🖥️" theme={{ preset: 'terminal' }} class="min-h-full bg-[#0b1210] px-8 py-10 font-mono text-[#7dd6a0] @md:px-12">
  <Box class="mx-auto max-w-2xl">
    <Box class="flex items-baseline gap-3 border-[#1d3329] border-b pb-3">
      <Span class="text-[#3f7d5c]">~/vault/ops</Span>
      <Span class="ml-auto text-[11px] text-[#3f7d5c]">uptime 99.98%</Span>
    </Box>
    <H1 class="mt-6 font-bold text-3xl tracking-tight text-[#a7f3c4]">Ops Log</H1>
    <P class="mt-2 text-[#3f7d5c] text-sm">incident notes and runbook fragments. green means calm.</P>
    <Code lang="bash" class="mt-6 rounded border border-[#1d3329] bg-[#08100d] p-4 text-[13px] leading-relaxed text-[#7dd6a0]">$ washi doctor --all
  storage ......... ok (wal, 3ms)
  loro snapshots .. ok (12 docs)
  mcp loopback .... refused (as designed)</Code>
    <Callout tone="success" class="mt-4 rounded border border-[#1d3329] bg-[#0d1a14] px-4 py-3 text-sm text-[#7dd6a0]">No open incidents. Last page: 2026-08-02, resolved in 41m.</Callout>
    <H3 class="mt-8 mb-2 text-[11px] uppercase tracking-[0.25em] text-[#3f7d5c]">Standing checks</H3>
    <TaskList class="space-y-1.5 text-sm">
      <Task done>rotate tsuru allowlist quarterly</Task>
      <Task done>verify oplog compaction</Task>
      <Task>chaos-test approval timeout path</Task>
    </TaskList>
    <Divider class="my-8 border-[#1d3329]" />
    <P class="text-[#3f7d5c] text-sm">Rule one: roll back beats hotfix. Rule two: see rule one.</P>
  </Box>
</Sheet>
`
const SYSTEM_MAP = `<Sheet title="System Map" icon="📐" theme={{ preset: 'blueprint' }} class="min-h-full bg-[#12335c] px-8 py-12 text-[#dbe7f7] @md:px-14" >
  <Box class="mx-auto max-w-2xl">
    <Box class="flex items-center gap-3 border-[#3f6591] border-b pb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[#8fb3dd]">
      <Span>washi · topology</Span><Span class="ml-auto">rev C</Span>
    </Box>
    <H1 class="mt-8 font-bold text-4xl tracking-tight">System Map</H1>
    <P class="mt-3 max-w-md text-[#8fb3dd] leading-relaxed">Washi's process topology, as a field drawing.</P>
    <Columns class="mt-8">
      <Column><Card title="CEF renderer" class="rounded border border-[#3f6591] bg-white/5 p-4 [&>div:first-child]:mb-1.5 [&>div:first-child]:font-mono [&>div:first-child]:text-[11px] [&>div:first-child]:uppercase [&>div:first-child]:tracking-widest [&>div:first-child]:text-[#8fb3dd]"><P class="text-sm leading-relaxed">React UI · paper components · WSX render</P></Card></Column>
      <Column><Card title="Bun worker" class="rounded border border-[#3f6591] bg-white/5 p-4 [&>div:first-child]:mb-1.5 [&>div:first-child]:font-mono [&>div:first-child]:text-[11px] [&>div:first-child]:uppercase [&>div:first-child]:tracking-widest [&>div:first-child]:text-[#8fb3dd]"><P class="text-sm leading-relaxed">router · services · sqlite · agent host</P></Card></Column>
    </Columns>
    <Timeline class="mt-8 space-y-3">
      <Step marker="RPC" title="typed loopback websocket" class="[&>span]:rounded [&>span]:bg-white/10 [&>span]:font-mono [&>span]:text-[10px] [&>div>div:first-child]:font-semibold [&>div>div:last-child]:text-[#8fb3dd] [&>div>div:last-child]:text-sm">token-gated, one router, ctx carries the window</Step>
      <Step marker="MCP" title="in-process tools" class="[&>span]:rounded [&>span]:bg-white/10 [&>span]:font-mono [&>span]:text-[10px] [&>div>div:first-child]:font-semibold [&>div>div:last-child]:text-[#8fb3dd] [&>div>div:last-child]:text-sm">sheet_*, db_*, tsuru fetch, hanko actions</Step>
      <Step marker="SYNC" title="future: loro + oplog relay" class="[&>span]:rounded [&>span]:bg-white/10 [&>span]:font-mono [&>span]:text-[10px] [&>div>div:first-child]:font-semibold [&>div>div:last-child]:text-[#8fb3dd] [&>div>div:last-child]:text-sm">server is a durable relay, never a merge brain</Step>
    </Timeline>
    <Callout tone="info" class="mt-8 rounded border border-[#3f6591] bg-white/5 px-4 py-3 text-sm">Every line on this sheet is data. The map cannot execute the territory.</Callout>
  </Box>
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

const INTERACTIVE = `<Sheet title="Interactive Kit" icon="🎛️" theme={{ accent: 'violet' }} state={{ view: 'controls', details: false, budget: 40 }} class="min-h-full bg-[#faf7ff] px-8 py-12 text-[#2f2740] @md:px-14">
  <Box class="mx-auto max-w-2xl">
    <Tape color="violet" class="font-bold text-[11px] uppercase tracking-[0.2em]">stateful · still data</Tape>
    <H1 class="mt-6 font-display font-black text-4xl tracking-tight">Interactive Kit</H1>
    <P class="mt-3 max-w-lg text-[#6b5f85] leading-relaxed">Hook-shaped interactivity with zero executable content: controls write to sheet state, Show reads it.</P>
    <Tabs labels={['controls', 'feedback', 'overlay']} state="view" class="mt-8 [&>div:first-child]:mb-5 [&>div:first-child]:gap-1 [&>div:first-child]:border-[#e4dcf5] [&>div:first-child]:border-b [&_button]:-mb-px [&_button]:border-b-2 [&_button]:border-transparent [&_button]:px-3 [&_button]:py-2 [&_button]:font-medium [&_button]:text-[#6b5f85] [&_button]:text-sm [&_button[data-active]]:border-[#7c5cff] [&_button[data-active]]:text-[#2f2740]">
    <Tab class="space-y-4">
      <Switch state="details" label="Show the fine print" class="text-sm" />
      <Show when="details">
        <Callout tone="info" class="rounded-xl border-[#e4dcf5] bg-white px-4 py-3 text-sm">This paragraph exists because a switch flipped a state key — no handlers were written.</Callout>
      </Show>
      <Slider state="budget" min={0} max={100} step={5} label="Budget burn" class="text-sm [&>span]:mb-1.5 [&>span]:font-mono [&>span]:text-[11px] [&>span]:text-[#6b5f85]" />
      <Show when="details">
        <P class="font-mono text-[11px] text-[#6b5f85]">State keys: view · details · budget. All declared on the Sheet, all plain scalars.</P>
      </Show>
    </Tab>
    <Tab class="space-y-4 text-sm">
      <P class="flex flex-wrap items-center gap-2">Status: <Badge class="rounded-md px-2 py-0.5 font-medium text-xs">shipped</Badge> <Badge tone="outline" class="rounded-md border-[#d9cdf2] px-2 py-0.5 text-xs">review</Badge> <Badge tone="destructive" class="rounded-md px-2 py-0.5 text-xs">blocked</Badge></P>
      <P class="flex flex-wrap items-center gap-2">Owners: <Avatar label="Juan Vasquez" class="size-8 rounded-full bg-[#ede6ff] text-[11px] font-semibold text-[#5b4a8a]" /> <Avatar label="Washi Agent" class="size-8 rounded-full bg-[#ede6ff] text-[11px] font-semibold text-[#5b4a8a]" /> <Tooltip label="hover works too" class="[&>span:last-child]:rounded-md [&>span:last-child]:text-xs"><Span class="underline decoration-dotted">hover me</Span></Tooltip></P>
      <Progress value={62} class="rounded-full bg-[#ede6ff] [&>div]:bg-[#7c5cff]" />
      <Skeleton class="w-1/2 rounded-md bg-[#ede6ff]" />
      <P class="flex items-center gap-1.5">Shortcuts: <Kbd class="rounded border border-[#d9cdf2] bg-white px-1.5 py-0.5 font-mono text-[11px]">⌘K</Kbd> <Kbd class="rounded border border-[#d9cdf2] bg-white px-1.5 py-0.5 font-mono text-[11px]">⌘Enter</Kbd></P>
    </Tab>
    <Tab class="space-y-4">
      <Dialog trigger="Open a dialog" title="Native, sandboxed, boring" class="rounded-lg bg-[#7c5cff] px-4 py-2 font-medium text-sm text-white">
        <P class="pt-2 text-sm leading-relaxed">Even this modal is declarative — a trigger label and children. The sheet never sees an event handler.</P>
      </Dialog>
      <Accordion class="divide-y divide-[#e4dcf5] rounded-xl border border-[#e4dcf5] bg-white">
        <AccordionItem title="Why no hooks?" class="px-4 py-3 [&>summary]:font-medium [&>summary]:text-sm [&>div]:pt-2 [&>div]:text-[#6b5f85] [&>div]:text-sm">
          <P>Hooks are code. Sheets are paper. A prompt-injected agent should never be able to make paper execute.</P>
        </AccordionItem>
        <AccordionItem title="What if I need real logic?" class="px-4 py-3 [&>summary]:font-medium [&>summary]:text-sm [&>div]:pt-2 [&>div]:text-[#6b5f85] [&>div]:text-sm">
          <P>Bind data with ink, trigger verbs with hanko. Q11 is closed: the answer is another component, never a scripting hatch.</P>
        </AccordionItem>
      </Accordion>
    </Tab>
    </Tabs>
  </Box>
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
