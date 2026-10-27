import { dailyCron, latestOccurrence } from '@washi/domain'
import { createRoutine, getTableByName, type Workspace } from '@washi/repository'
import { firstMinuteOfDay, zonedNow } from '../agents/routines'
import { createSheetFromSource } from '../sheets/service'
import { InkError } from './errors'
import { defineUserTable, runMutation } from './service'
import {
  ISSUE_COLUMNS,
  ISSUE_GROUPS,
  ISSUES_SPEC,
  PROJECTS_SPEC,
  REVIEW_MINUTE,
  REVIEW_PROMPT,
  SEED_ISSUES,
} from './team-space-values'
import type { TeamSpace, TeamSpaceOptions } from './types'

const page = (title: string, icon: string, body: string) => ({
  title,
  source: `<Sheet title=${JSON.stringify(title)} icon="${icon}" wsx="1">\n${body}\n</Sheet>\n`,
})

const DAY_MS = 86_400_000

/** A day `from` days after today in `timeZone`, or a range of `length` days from there. */
function span(timeZone: string, from: number, length?: number): string {
  const today = Date.parse(`${zonedNow(new Date(), timeZone).day}T00:00:00Z`)
  const day = (offset: number) => new Date(today + offset * DAY_MS).toISOString().slice(0, 10)
  return length ? `${day(from)}/${day(from + length)}` : day(from)
}

/** A team's week, ready on day one: backlog, roadmap, wiki, ideas and a review that keeps itself. */
export function seedTeamSpace(ws: Workspace, options: TeamSpaceOptions): TeamSpace {
  if (getTableByName(ws, 'issues') || getTableByName(ws, 'projects')) {
    throw new InkError('this workspace already has issues or projects; the team space would clash')
  }
  defineUserTable(ws, PROJECTS_SPEC)
  defineUserTable(ws, ISSUES_SPEC)
  const project =
    runMutation(
      ws,
      {
        kind: 'insert',
        table: 'projects',
        data: { name: 'Team space', status: 'In progress', when: span(options.timeZone, 0, 28) },
      },
      options.actorId,
    ).id ?? ''
  SEED_ISSUES.forEach((issue, index) => {
    runMutation(
      ws,
      {
        kind: 'insert',
        table: 'issues',
        data: {
          ...issue,
          project: [project],
          rank: index + 1,
          due: span(options.timeZone, 7 * (index + 1)),
        },
      },
      options.actorId,
    )
  })

  const backlog = createSheetFromSource(
    ws,
    page(
      'Backlog',
      'kanban',
      `  <Title>Backlog</Title>
  <Text lead>Every issue the team is carrying. Drag on the board to move one; open it to write it up.</Text>
  <Database table="issues" views={[{ name: 'Board', kind: 'board', groupBy: 'status' }, { name: 'All issues', kind: 'table', columns: ${JSON.stringify(ISSUE_COLUMNS).replaceAll('"', "'")} }, { name: 'Timeline', kind: 'timeline', date: 'due' }]} />`,
    ),
  )
  createSheetFromSource(
    ws,
    page(
      'Roadmap',
      'flag',
      `  <Title>Roadmap</Title>
  <Text lead>Projects on the calendar. Drag a bar to move its dates.</Text>
  <Database table="projects" views={[{ name: 'Timeline', kind: 'timeline', date: 'when' }, { name: 'Projects', kind: 'table' }]} />`,
    ),
  )
  const wiki = createSheetFromSource(
    ws,
    page(
      'Wiki',
      'book',
      `  <Title>Wiki</Title>
  <Text lead>What the team knows. Each page nests under the one above it.</Text>`,
    ),
  )
  createSheetFromSource(
    ws,
    page(
      'How we work',
      'compass',
      `  <Title>How we work</Title>
  <List marker="bullet">
    <Item>Issues live in the Backlog; anything in flight has an owner.</Item>
    <Item>Projects live on the Roadmap, with dates.</Item>
    <Item>Washi refreshes the Weekly review every evening.</Item>
  </List>`,
    ),
    wiki.id,
  )
  createSheetFromSource(
    ws,
    page(
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
  )
  createSheetFromSource(
    ws,
    page(
      'Weekly review',
      'chart',
      `  <Title>Weekly review</Title>
  <Callout title="This week">Washi writes this every evening from the backlog.</Callout>
  <Title level={2}>Shipped, last 30 days</Title>
  <Chart kind="area" history={{ table: 'issues', where: [{ column: 'status', op: 'in', value: ${JSON.stringify(ISSUE_GROUPS.done).replaceAll('"', "'")} }], range: '30d' }} />
  <Title level={2}>Still open</Title>
  <Chart kind="area" history={{ table: 'issues', where: [{ column: 'status', op: 'in', value: ${JSON.stringify([...ISSUE_GROUPS.todo, ...ISSUE_GROUPS.doing]).replaceAll('"', "'")} }], range: '30d' }} />
  <Database table="issues" views={[{ name: 'Shipped', kind: 'table', where: [{ column: 'status', op: 'eq', value: 'Done' }], columns: ['status', 'assignee', 'project', 'due'] }, { name: 'In flight', kind: 'board', groupBy: 'status' }]} />`,
    ),
  )
  createRoutine(ws, {
    title: 'Weekly review',
    prompt: REVIEW_PROMPT,
    cron: dailyCron(REVIEW_MINUTE),
    minuteOfDay: firstMinuteOfDay(dailyCron(REVIEW_MINUTE)),
    timeZone: options.timeZone,
    createdBy: options.actorId,
    // Set up after 17:00, the first review is tomorrow's — never a run the moment the space appears.
    lastRunAt: latestOccurrence(dailyCron(REVIEW_MINUTE), options.timeZone, new Date()),
  })
  return { backlog: backlog.id }
}
