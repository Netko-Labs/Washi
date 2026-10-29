import type { Specimen } from '../types'

const OPTIONS =
  '<Option title="SQLite"><List><Item>One file per workspace</Item><Item>Nothing to run</Item></List></Option><Option title="Postgres" pick><List><Item>Many writers at once</Item><Item>A server to keep</Item></List></Option>'

export const EXPLAIN_SPECIMENS: Record<string, Specimen> = {
  Steps: {
    children:
      '<Step title="Install Bun"><Code lang="sh">curl -fsSL https://bun.sh/install | bash</Code></Step><Step title="Add what it needs"><Code lang="sh">bun install</Code></Step><Step title="Run it"><Text>bun dev opens the app.</Text></Step>',
  },
  Compare: { children: OPTIONS },
  Option: {
    props: { title: 'Postgres', pick: true },
    children: '<List><Item>Many writers at once</Item><Item>A server to keep</Item></List>',
    wrap: '<Compare><Option title="SQLite"><List><Item>One file per workspace</Item></List></Option><Here /></Compare>',
  },
  Faq: {
    children:
      '<Question title="Where do my pages live?"><Text>In one file per workspace, on your server.</Text></Question><Question title="Can Washi edit a page?"><Text>Yes — every write it makes can be undone.</Text></Question><Question title="Who reads a private page?"><Text>The people it names and the owners.</Text></Question>',
  },
  Question: {
    props: { title: 'Can Washi edit a page?' },
    children: '<Text>Yes — every write it makes can be undone.</Text>',
    wrap: '<Faq><Question title="Where do my pages live?"><Text>In one file per workspace.</Text></Question><Here /></Faq>',
  },
  Countdown: { props: { to: '2026-12-24', label: 'Until the winter break' } },
}
