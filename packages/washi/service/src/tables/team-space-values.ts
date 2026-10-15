export const ISSUE_GROUPS = {
  todo: ['Backlog', 'Todo'],
  doing: ['In progress', 'In review'],
  done: ['Done'],
}

export const PROJECTS_SPEC = {
  name: 'projects',
  columns: [
    { name: 'name', type: 'text' },
    {
      name: 'status',
      type: 'status',
      groups: { todo: ['Planned'], doing: ['In progress'], done: ['Shipped'] },
    },
    { name: 'lead', type: 'person' },
    { name: 'when', type: 'date' },
  ],
}

export const ISSUES_SPEC = {
  name: 'issues',
  columns: [
    { name: 'title', type: 'text' },
    { name: 'status', type: 'status', groups: ISSUE_GROUPS },
    { name: 'assignee', type: 'person' },
    { name: 'priority', type: 'select', options: ['Urgent', 'High', 'Medium', 'Low'] },
    { name: 'labels', type: 'multi_select', options: ['Bug', 'Feature', 'Chore'] },
    { name: 'project', type: 'relation', table: 'projects' },
    { name: 'estimate', type: 'number' },
    { name: 'due', type: 'date' },
    { name: 'rank', type: 'number' },
  ],
}

export const SEED_ISSUES = [
  { title: 'Invite the team', status: 'Todo', priority: 'High', labels: ['Chore'] },
  { title: 'Write how we work', status: 'In progress', priority: 'Medium', labels: ['Chore'] },
  { title: 'Draw the first idea', status: 'Backlog', priority: 'Low', labels: ['Feature'] },
]

export const REVIEW_PROMPT = `Refresh the "Weekly review" page. Read the issues table (db_query) and its history (db_history, range 7d) and rewrite only the Callout titled "This week": three short lines — what shipped, what started, what is stuck — naming issues by title. Leave every other block on the page exactly as it is.`
