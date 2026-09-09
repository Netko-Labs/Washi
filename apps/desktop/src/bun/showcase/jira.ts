/** WSX · Sprint 12 — a Jira-shaped sprint on the issues table: overview, board, drawer, backlog. */

const ISSUE_FIELDS = `<Grid gap="tight">
          <Field span={6} field="status" kind="select" label="Status" table="issues" size="sm" />
          <Field span={6} field="priority" kind="select" label="Priority" table="issues" size="sm" />
          <Field span={6} field="type" kind="select" label="Type" table="issues" size="sm" />
          <Field span={6} field="epic" kind="select" label="Epic" table="issues" size="sm" />
          <Field span={4} field="points" kind="number" label="Points" table="issues" size="sm" />
          <Field span={8} field="due" kind="date" label="Due" table="issues" size="sm" />
          <Field span={6} field="assignee" kind="text" label="Assignee" table="issues" size="sm" />
          <Field span={6} field="sprint" kind="select" label="Sprint" table="issues" size="sm" />
        </Grid>`

export const JIRA = `<Sheet title="WSX · Sprint 12" icon="kanban" feel="board" tags={['jira', 'sprint']} visibility="shared" state={{ local: { view: 'Board', issue: null, schema: null } }} wsx="1">
  <Row align="center">
    <Tape>sprint 12</Tape>
    <Text emphasis="quiet" size="sm" class="grow">WSX project · 8–19 Sep 2026 · goal: land the query scope</Text>
    <Avatar label="Mira Kaneko" size="sm" tone="info" /><Avatar label="Peje" size="sm" tone="accent" /><Avatar label="Awa" size="sm" tone="success" />
    <Button variant="outline" tone="neutral" size="sm" action={{ verb: 'state.set', key: 'schema', value: true }}>Fields</Button>
  </Row>
  <Hero title="Sprint 12" subtitle="Land Filter and Timer, close the Matrix budget question. Every issue is a row in the issues table; the board, the overview, the drawer and the backlog read the same rows." size="md" />

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

  <Tabs labels={['Board', 'Backlog']} state="view">
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
        onOpen={{ verb: 'state.set', key: 'issue', value: '$row.id' }}
        onAdd={{ verb: 'table.insert', table: 'issues', data: { key: 'WSX-NEW', title: 'New issue', type: 'task', priority: 'medium', status: '$group', assignee: 'Peje', epic: 'Registry', sprint: 'Sprint 12', points: 1, due: '2026-09-19', rank: 99, done: false } }}
      />
      <Text size="sm" emphasis="quiet">Click a card to open it. Drag between columns to transition; drop on a card to reorder — each drop is one table.reorder.</Text>
    </Tab>
    <Tab>
      <Text size="sm" emphasis="quiet">Open an issue and move it into the sprint from its Sprint field. The overview follows.</Text>
      <Repeat bind={{ table: 'issues', where: [{ column: 'sprint', op: 'eq', value: 'Backlog' }], orderBy: { column: 'rank', direction: 'asc' } }} empty="The backlog is empty.">
        <Card size="sm">
          <Row align="center">
            <Tag>$row.key</Tag>
            <Text emphasis="strong" class="grow">$row.title</Text>
            <Badge>$row.priority</Badge><Badge tone="info">$row.epic</Badge>
            <Text size="sm" emphasis="quiet">$row.points pts</Text>
            <Button size="sm" variant="outline" tone="neutral" action={{ verb: 'state.set', key: 'issue', value: '$row.id' }}>Open</Button>
          </Row>
        </Card>
      </Repeat>
    </Tab>
  </Tabs>

  <Drawer state="issue" bind={{ table: 'issues' }} title="$row.key">
    <Row align="center"><Tag>$row.key</Tag><Badge>$row.type</Badge><Badge>$row.priority</Badge><Badge tone="info">$row.epic</Badge></Row>
    <Title level={2}>$row.title</Title>
    <Section title="Fields">${ISSUE_FIELDS}</Section>
    <Section title="Checklist">
      <Progress expr="count(checks where issue = $row.key and done = true) / count(checks where issue = $row.key)" label="done" tone="success" />
      <Repeat bind={{ table: 'checks', where: [{ column: 'issue', op: 'eq', value: '$row.key' }] }} empty="No checklist yet.">
        <Task>$row.label</Task>
      </Repeat>
      <Compose action={{ verb: 'table.insert', table: 'checks', data: { issue: '$row.key', label: '$value', done: false } }} label="Add" placeholder="Add a checklist item" />
    </Section>
    <Section title="Activity">
      <Repeat bind={{ table: 'activity', where: [{ column: 'issue', op: 'eq', value: '$row.key' }], orderBy: { column: 'at', direction: 'asc' } }} empty="Nothing yet.">
        <Row align="start"><Avatar label="$row.who" size="sm" /><Stack gap="tight" class="grow"><Row align="center" gap="tight"><Text size="sm" emphasis="strong">$row.who</Text><Badge size="sm">$row.kind</Badge><Text size="sm" emphasis="quiet">$row.at</Text></Row><Text size="sm">$row.body</Text></Stack></Row>
      </Repeat>
      <Compose action={{ verb: 'table.insert', table: 'activity', data: { issue: '$row.key', kind: 'comment', who: 'Peje', body: '$value', at: '$now' } }} label="Comment" placeholder="Write a comment" multiline />
    </Section>
    <Row align="center">
      <Text size="sm" emphasis="quiet" class="grow">table.update · issues · $row.key</Text>
      <Button size="sm" variant="outline" tone="danger" action={{ verb: 'table.delete', table: 'issues', row: '$row.id' }}>Delete issue</Button>
    </Row>
  </Drawer>

  <Drawer state="schema" title="Table schema · issues">
    <Text size="sm" emphasis="quiet">Fields are vault-level — defined once, carried by every issue. Adding a column never breaks existing rows; new columns default empty.</Text>
    <Schema table="issues" />
  </Drawer>
</Sheet>
`
