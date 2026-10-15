import { createRoutine, getTableByName, type Workspace } from '@washi/repository'
import { createSheetFromSource } from '../sheets/service'
import { InkError } from './errors'
import { defineUserTable, runMutation } from './service'
import {
  ISSUE_GROUPS,
  ISSUES_SPEC,
  PROJECTS_SPEC,
  REVIEW_PROMPT,
  SEED_ISSUES,
} from './team-space-values'
import type { TeamSpace, TeamSpaceOptions } from './types'

const sheet = (title: string, icon: string, body: string) =>
  `<Sheet title=${JSON.stringify(title)} icon="${icon}" wsx="1">\n${body}\n</Sheet>\n`

/** A team's week, ready on day one: backlog, roadmap, wiki, ideas and a review that keeps itself. */
export function seedTeamSpace(ws: Workspace, options: TeamSpaceOptions): TeamSpace {
  if (getTableByName(ws, 'issues') || getTableByName(ws, 'projects')) {
    throw new InkError('this workspace already has issues or projects; the team space would clash')
  }
  defineUserTable(ws, PROJECTS_SPEC)
  defineUserTable(ws, ISSUES_SPEC)
  const project =
    runMutation(ws, {
      kind: 'insert',
      table: 'projects',
      data: { name: 'Team space', status: 'In progress' },
    }).id ?? ''
  SEED_ISSUES.forEach((issue, index) => {
    runMutation(ws, {
      kind: 'insert',
      table: 'issues',
      data: { ...issue, project: [project], rank: index + 1 },
    })
  })

  const backlog = createSheetFromSource(ws, {
    title: 'Backlog',
    source: sheet(
      'Backlog',
      'kanban',
      `  <Title>Backlog</Title>
  <Text lead>Every issue the team is carrying. Drag on the board to move one; open it to write it up.</Text>
  <Database table="issues" views={[{ name: 'Board', kind: 'board', groupBy: 'status' }, { name: 'All issues', kind: 'table' }, { name: 'Timeline', kind: 'timeline', date: 'due' }]} />`,
    ),
  })
  createSheetFromSource(ws, {
    title: 'Roadmap',
    source: sheet(
      'Roadmap',
      'flag',
      `  <Title>Roadmap</Title>
  <Text lead>Projects on the calendar. Drag a bar to move its dates.</Text>
  <Database table="projects" views={[{ name: 'Timeline', kind: 'timeline', date: 'when' }, { name: 'Projects', kind: 'table' }]} />`,
    ),
  })
  const wiki = createSheetFromSource(ws, {
    title: 'Wiki',
    source: sheet(
      'Wiki',
      'book',
      `  <Title>Wiki</Title>
  <Text lead>What the team knows. Each page nests under the one above it.</Text>`,
    ),
  })
  createSheetFromSource(
    ws,
    {
      title: 'How we work',
      source: sheet(
        'How we work',
        'compass',
        `  <Title>How we work</Title>
  <List marker="bullet">
    <Item>Issues live in the Backlog; anything in flight has an owner.</Item>
    <Item>Projects live on the Roadmap, with dates.</Item>
    <Item>Washi refreshes the Weekly review every evening.</Item>
  </List>`,
      ),
    },
    wiki.id,
  )
  createSheetFromSource(ws, {
    title: 'Ideas',
    source: sheet(
      'Ideas',
      'leaf',
      `  <Title>Ideas</Title>
  <Text lead>Draw it out. Double-click to rename, drag between dots to connect.</Text>
  <Canvas>
    <Node id="idea" x={0} y={0} tone="info">An idea</Node>
    <Node id="shape" x={260} y={0}>Shape it</Node>
    <Node id="backlog" x={520} y={0} tone="success" page="${backlog.id}">Into the backlog</Node>
    <Edge from="idea" to="shape" />
    <Edge from="shape" to="backlog" label="ready" />
  </Canvas>`,
    ),
  })
  createSheetFromSource(ws, {
    title: 'Weekly review',
    source: sheet(
      'Weekly review',
      'chart',
      `  <Title>Weekly review</Title>
  <Callout title="This week">Washi writes this every evening from the backlog.</Callout>
  <Title level={2}>Shipped, last 30 days</Title>
  <Chart kind="area" history={{ table: 'issues', where: [{ column: 'status', op: 'in', value: ${JSON.stringify(ISSUE_GROUPS.done).replaceAll('"', "'")} }], range: '30d' }} />
  <Title level={2}>Still open</Title>
  <Chart kind="area" history={{ table: 'issues', where: [{ column: 'status', op: 'in', value: ${JSON.stringify([...ISSUE_GROUPS.todo, ...ISSUE_GROUPS.doing]).replaceAll('"', "'")} }], range: '30d' }} />
  <Database table="issues" views={[{ name: 'Shipped', kind: 'table', where: [{ column: 'status', op: 'eq', value: 'Done' }] }, { name: 'In flight', kind: 'board', groupBy: 'status' }]} />`,
    ),
  })
  createRoutine(ws, {
    title: 'Weekly review',
    prompt: REVIEW_PROMPT,
    minuteOfDay: 17 * 60,
    timeZone: options.timeZone,
    createdBy: options.actorId,
    lastRunDay: null,
  })
  return { backlog: backlog.id }
}
