import type { Specimen } from '../types'

export const LAYOUT_SPECIMENS: Record<string, Specimen> = {
  Section: {
    props: { title: 'This week' },
    children:
      '<Text>Three issues shipped, one slipped.</Text><Text size="sm" emphasis="quiet">One more in review.</Text>',
  },
  Row: {
    props: { align: 'center' },
    children: '<Avatar label="Juan" /><Text>Juan</Text><Chip>owner</Chip>',
  },
  Stack: {
    children:
      '<Card title="One"><Text size="sm">First.</Text></Card><Card title="Two"><Text size="sm">Second.</Text></Card>',
  },
  Grid: {
    children:
      '<Card span={8} variant="outline"><Text size="sm">span 8</Text></Card><Card span={4} variant="filled"><Text size="sm">span 4</Text></Card><Card span={4} variant="filled"><Text size="sm">4</Text></Card><Card span={4} variant="filled"><Text size="sm">4</Text></Card><Card span={4} variant="filled"><Text size="sm">4</Text></Card>',
  },
  Divider: {},
  PageLink: { props: { sheet: 'budget' } },
  Include: { props: { sheet: 'budget' } },
  Widget: {
    code: "import { useNow } from 'washi'\n\nfunction Clock() {\n  const now = new Date(useNow())\n  return <div style={{ font: '600 40px system-ui', color: 'var(--accent)' }}>{now.toLocaleTimeString()}</div>\n}",
    props: { title: 'A clock', height: 90 },
    children: '<Clock />',
  },
  Formula: {
    props: { name: 'with_tax', title: 'Price with tax' },
    children:
      '{`function with_tax(amount: number, rate = 0.19) {\n  return Math.round(amount * (1 + rate) * 100) / 100\n}`}',
  },
  Automation: {
    props: { table: 'tasks', on: 'insert', title: 'Every new task starts as todo' },
    children:
      "{`function run(event) {\n  if (!event.row.status) act({ verb: 'table.update', table: 'tasks', row: event.row.id, set: { status: 'todo' } })\n}`}",
  },
  Gallery: {
    props: { columns: 3 },
    children:
      '<Figure src="https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg" alt="Grapefruit" caption="Breakfast" /><Figure src="https://interactive-examples.mdn.mozilla.net/media/examples/plumeria.jpg" alt="Plumeria" caption="The garden" /><Figure src="https://interactive-examples.mdn.mozilla.net/media/cc0-images/surfer-240-200.jpg" alt="Surfer" caption="The coast" />',
  },
  Video: {
    props: {
      src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      title: 'A flower, opening',
    },
  },
  Audio: {
    props: {
      src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
      title: 'T-rex roar',
    },
  },
  File: {
    props: { src: 'https://example.com/budget-2026.pdf', name: 'budget-2026.pdf', bytes: 482113 },
  },
  Bookmark: {
    props: {
      href: 'https://bun.com/docs',
      title: 'Bun — a fast all-in-one JavaScript runtime',
      description: 'Bundle, install and run JavaScript and TypeScript, all in Bun.',
      site: 'Bun',
    },
  },
  Backlinks: {},
  Outline: {
    props: { title: 'On this page' },
    wrap: '<Here /><Title level={2}>Fixed costs</Title><Text>Rent first.</Text><Title level={3}>Phone</Title><Text>Then the rest.</Text>',
  },
  Embed: { props: { src: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', title: 'Me at the zoo' } },
  Subpages: { props: { layout: 'gallery' } },
  Columns: {
    children:
      '<Column><Card title="Rail"><Text size="sm">Narrow.</Text></Card></Column><Column ratio={2}><Card title="Main"><Text size="sm">Twice as wide.</Text></Card></Column>',
  },
  Column: {
    props: { ratio: 2 },
    children: '<Card title="This column"><Text size="sm">Two shares.</Text></Card>',
    wrap: '<Columns><Column><Card title="Beside"><Text size="sm">One share.</Text></Card></Column><Here /></Columns>',
  },
  Bento: {
    children:
      '<Tile shape="big" title="Big"><Stat label="Open" value="12" /></Tile><Tile title="Square"><Text size="sm">One cell.</Text></Tile><Tile shape="tall" title="Tall"><Text size="sm">Two rows.</Text></Tile><Tile title="Square"><Text size="sm">One cell.</Text></Tile><Tile shape="banner" variant="filled" tone="accent" title="Banner"><Text size="sm">The whole row.</Text></Tile>',
  },
  Tile: {
    props: { shape: 'wide', title: 'Wide' },
    children: '<Text size="sm">Two cells across.</Text>',
    wrap: '<Bento><Here /><Tile title="Beside"><Text size="sm">One.</Text></Tile></Bento>',
  },
}
