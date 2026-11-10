import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { openWorkspace, type Workspace } from '@washi/repository'
import { parse } from '@washi/wsx'
import {
  AgentGuideError,
  agentGuide,
  agentGuideId,
  agentGuidePage,
  createSheetFromSource,
  defineUserTable,
  openRowPage,
  pageMarkdown,
  runMutation,
  setAgentGuide,
  workspaceContext,
} from '../index'

const MEMBER = { id: 'u-ana', isOwner: false }
const OTHER = { id: 'u-bo', isOwner: false }

let ws: Workspace

const page = (title: string, body: string, parent: string | null = null, extra = '') =>
  createSheetFromSource(
    ws,
    { title, source: `<Sheet title="${title}"${extra}>\n${body}\n</Sheet>` },
    parent,
  ).id

const md = (body: string) =>
  pageMarkdown(parse(`<Sheet title="T">${body}</Sheet>`), {
    titles: new Map([['p-1', 'Roadmap']]),
    children: new Map(),
    pageId: 'x',
  })

beforeEach(() => {
  ws = openWorkspace({ id: 'ctx', path: ':memory:' })
  defineUserTable(ws, {
    name: 'issues',
    columns: [
      { name: 'title', type: 'text' },
      {
        name: 'status',
        type: 'status',
        groups: { todo: ['Todo'], doing: ['Doing'], done: ['Done'] },
      },
      { name: 'priority', type: 'select', options: ['P1', 'P2'] },
      { name: 'notes', type: 'text' },
    ],
  })
  const rows = Array.from({ length: 14 }, (_, at) => ({
    title: `Issue ${at + 1}`,
    status: at < 3 ? 'Done' : at < 5 ? 'Doing' : 'Todo',
    priority: at % 2 ? 'P2' : 'P1',
    notes: 'a long note nobody needs in a digest '.repeat(4),
  }))
  runMutation(ws, { kind: 'insert', table: 'issues', data: rows }, MEMBER.id)
})

afterEach(() => ws.close())

describe('a page as Markdown (D135)', () => {
  test('words keep their shape: headings, lists, tasks, quotes, callouts, code, pairs', () => {
    const out = md(`
      <Section title="Plan">
        <Text>Ship **it** with <Ref sheet="p-1">the map</Ref>.</Text>
        <List><Item done={true}>Done thing</Item><Item>Open thing</Item></List>
      </Section>
      <Quote>Said once.</Quote>
      <Callout tone="warning" title="Careful">Mind the gap.</Callout>
      <Code lang="ts">const a = 1</Code>
      <Pair term="Repo">acme/app</Pair>
      <Pair term="Branch">main</Pair>`)
    expect(out).toBe(
      [
        '### Plan',
        'Ship **it** with [the map](sheet:p-1).',
        '- [x] Done thing\n- Open thing',
        '> Said once.',
        '> **Careful (warning):** Mind the gap.',
        '```ts\nconst a = 1\n```',
        '- **Repo:** acme/app\n- **Branch:** main',
      ].join('\n\n'),
    )
  })

  test('a written table is a pipe table; steps and a timeline keep their titles', () => {
    const out = md(`
      <Table columns={["Area", "Note"]} rows={[["UI", "a | b"], ["API", "fast"]]} />
      <Steps><Step title="Cut">a branch</Step><Step title="Ship">it</Step></Steps>
      <Timeline><Step marker="0:15" title="Wake">hello</Step></Timeline>`)
    expect(out).toContain('| Area | Note |\n| --- | --- |\n| UI | a \\| b |\n| API | fast |')
    expect(out).toContain('1. **Cut** — a branch\n2. **Ship** — it')
    expect(out).toContain('- 0:15 **Wake** — hello')
  })

  test('a block that draws rows is one line naming its table, never the rows', () => {
    const out = md(`
      <Board bind={{"table": "issues", "where": [{"column": "status", "op": "ne", "value": "Done"}]}} groupBy="status" title="title" />
      <Database table="issues" views={[{"name": "All", "kind": "table"}]} />
      <Roadmap bind={{"table": "milestones"}} date="start" end="end" title="name" />`)
    expect(out).toBe(
      [
        '*Board over `issues` where status ne Done grouped by status; cards titled by title*',
        '*Database `issues` — views: All (table)*',
        '*Roadmap over `milestones`; bars from start, to end, titled by name*',
      ].join('\n\n'),
    )
  })
})

describe('context_get: a workspace in one read (D135)', () => {
  test('the tree, every readable page, the tables and their open rows — nothing private', () => {
    const home = page(
      'Home',
      '<Text>Welcome.</Text>\n<Stat label="Open" expr="count(issues where status != \'Done\')" />',
    )
    page('Plan', '<Text>The plan.</Text>', home)
    page(
      'Secret',
      '<Text>Not for Ana.</Text>',
      null,
      ` visibility="private" access={["${OTHER.id}"]}`,
    )
    const out = workspaceContext(ws, MEMBER, { workspaceName: 'Acme' })
    expect(out).toStartWith('# Acme — workspace context')
    expect(out).toContain('## Pages\n- Home\n  - Plan')
    expect(out).toContain('## Plan')
    expect(out).toContain('- Open: 11')
    expect(out).not.toContain('Secret')
    expect(out).not.toContain('Not for Ana')
    expect(out).toContain('- status: Todo 9 · Doing 2 · Done 3')
    expect(out).toContain('Open rows (11 of 14')
    expect(out).toContain('**Todo** (9)\n- Issue 14 · P2')
    expect(out).not.toContain('Issue 1 ·')
    // A long text column is left out of the row lines and named with the call that reads it.
    expect(out).not.toContain('a long note')
    expect(out).toContain('notes and each row')
    expect(out).toContain('*Nothing left out.*')
  })

  test('maxChars cuts pages evenly and rows past their share, and says how to read the rest', () => {
    for (let at = 0; at < 6; at++) page(`Long ${at}`, `<Text>${'word '.repeat(600)}</Text>`)
    const out = workspaceContext(ws, MEMBER, { maxChars: 4000 })
    expect(out.length).toBeLessThanOrEqual(4000)
    expect(out).toContain('## Left out')
    expect(out).toContain('pages cut short')
    expect(out).toContain('*(cut — sheet_get for the rest)*')
  })

  test('root and depth read part of the tree', () => {
    const home = page('Home', '<Text>Top.</Text>')
    const plan = page('Plan', '<Text>Mid.</Text>', home)
    page('Deep', '<Text>Bottom.</Text>', plan)
    const out = workspaceContext(ws, MEMBER, { root: plan, depth: 0 })
    expect(out).toContain('## Plan')
    expect(out).not.toContain('## Deep')
    expect(out).not.toContain('## Home')
  })

  test('the agent guide leads, and only for a reader who may read it', () => {
    page('Home', '<Text>Top.</Text>')
    const guide = page('Playbook', '<Text>Always run the checks.</Text>')
    expect(setAgentGuide(ws, guide, MEMBER, true)).toEqual({ id: guide, title: 'Playbook' })
    const out = workspaceContext(ws, MEMBER)
    expect(out.indexOf('## Playbook (agent guide')).toBeLessThan(out.indexOf('## Pages'))
    expect(agentGuide(ws, MEMBER)?.markdown).toBe('Always run the checks.')
    expect(agentGuidePage(ws, MEMBER)).toEqual({ id: guide, title: 'Playbook' })

    const closed = page(
      'Closed',
      '<Text>x</Text>',
      null,
      ` visibility="private" access={["${OTHER.id}"]}`,
    )
    expect(() => setAgentGuide(ws, closed, MEMBER, true)).toThrow()
    setAgentGuide(ws, closed, OTHER, true)
    expect(agentGuide(ws, MEMBER)).toBeNull()
    expect(agentGuidePage(ws, OTHER)).toEqual({ id: closed, title: 'Closed' })
  })

  test('only a steward sets the guide; one they cannot read stays; a row page never is it', () => {
    const guide = page('Playbook', '<Text>Run the checks.</Text>')
    expect(() => setAgentGuide(ws, guide, MEMBER, false)).toThrow(AgentGuideError)
    expect(() => setAgentGuide(ws, null, MEMBER, false)).toThrow('owner or an admin')
    const closed = page(
      'Closed',
      '<Text>x</Text>',
      null,
      ` visibility="private" access={["${OTHER.id}"]}`,
    )
    setAgentGuide(ws, closed, OTHER, true)
    // Ana, a steward who cannot read the guide in place, neither replaces nor clears it.
    expect(() => setAgentGuide(ws, guide, MEMBER, true)).toThrow('cannot read')
    expect(() => setAgentGuide(ws, null, MEMBER, true)).toThrow('cannot read')
    expect(agentGuideId(ws)).toBe(closed)
    expect(setAgentGuide(ws, null, OTHER, true)).toBeNull()
    expect(agentGuideId(ws)).toBeNull()

    const row = openRowPage(
      ws,
      runMutation(ws, { kind: 'insert', table: 'issues', data: { title: 'R' } }, MEMBER.id)
        .id as string,
    )
    expect(() => setAgentGuide(ws, row, MEMBER, true)).toThrow("a row's page")
  })
})
