/** WSX · Sprint 12 — a Jira-shaped sprint on the issues table: overview, board, issues, backlog. */

const ISSUE_CARD = `<Card size="sm">
        <Row align="center">
          <Tag>$row.key</Tag>
          <Text emphasis="strong" class="grow">$row.title</Text>
          <Badge tone="info">$row.epic</Badge>
        </Row>
        <Grid gap="tight">
          <Field span={3} field="status" kind="select" label="Status" table="issues" size="sm" />
          <Field span={3} field="priority" kind="select" label="Priority" table="issues" size="sm" />
          <Field span={2} field="type" kind="select" label="Type" table="issues" size="sm" />
          <Field span={2} field="points" kind="number" label="Points" table="issues" size="sm" />
          <Field span={2} field="due" kind="date" label="Due" table="issues" size="sm" />
          <Field span={3} field="assignee" kind="text" label="Assignee" table="issues" size="sm" />
          <Field span={3} field="epic" kind="select" label="Epic" table="issues" size="sm" />
          <Field span={3} field="sprint" kind="select" label="Sprint" table="issues" size="sm" />
        </Grid>
      </Card>`

export const JIRA = `<Sheet title="WSX · Sprint 12" icon="kanban" feel="board" tags={['jira', 'sprint']} visibility="shared" state={{ local: { view: 'Board' } }} wsx="1">
  <Row align="center">
    <Tape>sprint 12</Tape>
    <Text emphasis="quiet" size="sm" class="grow">WSX project · 8–19 Sep 2026 · goal: land the query scope</Text>
    <Avatar label="Mira Kaneko" size="sm" tone="info" /><Avatar label="Peje" size="sm" tone="accent" /><Avatar label="Awa" size="sm" tone="success" />
  </Row>
  <Hero title="Sprint 12" subtitle="Land Filter and Timer, close the Matrix budget question. Every issue is a row in the issues table; the board, the overview and the backlog read the same rows." size="md" />

  <Section title="Overview">
    <Grid>
      <Card span={3}><Stat label="issues in sprint" expr="count(issues where sprint = 'Sprint 12')" /></Card>
      <Card span={3}><Stat label="committed" expr="sum(issues.points where sprint = 'Sprint 12')" hint="story points" /></Card>
      <Card span={3}><Stat label="done" expr="sum(issues.points where sprint = 'Sprint 12' and status = 'Done')" hint="points" tone="success" /></Card>
      <Card span={3}><Stat label="days left" expr="days(now(), '2026-09-19')" hint="sprint ends 19 Sep" /></Card>
    </Grid>
    <Progress expr="sum(issues.points where sprint = 'Sprint 12' and status = 'Done') / sum(issues.points where sprint = 'Sprint 12')" label="sprint progress" tone="success" />
    <Grid>
      <Card span={4} title="Issues by type"><Chart bind={{ table: 'issues', where: [{ column: 'sprint', op: 'eq', value: 'Sprint 12' }], groupBy: { column: 'type', aggregates: [{ fn: 'count' }] } }} kind="donut" /></Card>
      <Card span={4} title="Points by assignee"><Chart bind={{ table: 'issues', where: [{ column: 'sprint', op: 'eq', value: 'Sprint 12' }], groupBy: { column: 'assignee', aggregates: [{ fn: 'sum', column: 'points' }] } }} kind="bar" /></Card>
      <Card span={4} title="Open by priority"><Chart bind={{ table: 'issues', where: [{ column: 'status', op: 'ne', value: 'Done' }], groupBy: { column: 'priority', aggregates: [{ fn: 'count' }] } }} kind="bar" /></Card>
    </Grid>
    <Show expr="count(issues where sprint = 'Sprint 12' and priority = 'highest' and status != 'Done') > 0">
      <Callout tone="danger" title="Highest priority still open">At least one highest-priority issue is not Done. It leads the board.</Callout>
    </Show>
    <Show expr="count(issues where sprint = 'Sprint 12' and status = 'In review') >= 2">
      <Callout tone="warning" title="Review queue">Two or more issues are waiting in review — clear them before pulling from the backlog.</Callout>
    </Show>
  </Section>

  <Tabs labels={['Board', 'Issues', 'Backlog']} state="view">
    <Tab>
      <Board
        bind={{ table: 'issues', where: [{ column: 'sprint', op: 'eq', value: 'Sprint 12' }] }}
        groupBy="status"
        groups={['To do', 'In progress', 'In review', 'Done']}
        rank="rank"
        kicker="key"
        title="title"
        badge="priority"
        meta="points"
        avatar="assignee"
        onAdd={{ verb: 'table.insert', table: 'issues', data: { key: 'WSX-NEW', title: 'New issue', type: 'task', priority: 'medium', status: '$group', assignee: 'Peje', epic: 'Registry', sprint: 'Sprint 12', points: 1, due: '2026-09-19', rank: 99, done: false } }}
      />
      <Text size="sm" emphasis="quiet">Drag between columns to transition; drop on a card to reorder. Each drop is one table.reorder — status plus a fractional rank.</Text>
    </Tab>
    <Tab>
      <Table bind={{ table: 'issues', where: [{ column: 'sprint', op: 'eq', value: 'Sprint 12' }], orderBy: { column: 'key', direction: 'asc' } }} columns={['key', 'title', 'type', 'priority', 'status', 'assignee', 'points', 'due']} />
    </Tab>
    <Tab>
      <Text size="sm" emphasis="quiet">Move an issue into the sprint by changing its Sprint field. The overview follows.</Text>
      <Repeat bind={{ table: 'issues', where: [{ column: 'sprint', op: 'eq', value: 'Backlog' }], orderBy: { column: 'rank', direction: 'asc' } }} empty="The backlog is empty.">
        ${ISSUE_CARD}
      </Repeat>
    </Tab>
  </Tabs>

  <Section title="Issue details · Sprint 12">
    <Repeat bind={{ table: 'issues', where: [{ column: 'sprint', op: 'eq', value: 'Sprint 12' }], orderBy: { column: 'key', direction: 'asc' } }}>
      ${ISSUE_CARD}
    </Repeat>
  </Section>
</Sheet>
`
