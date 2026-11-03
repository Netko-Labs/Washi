import type { Limit } from '../guide'

/** What a child policy means to someone writing a page. */
export const CHILDREN_WORDS = {
  nodes: 'blocks and words (words read inline marks)',
  text: 'text only, kept exactly as written',
  none: 'none — self-closing',
  component: 'one element: a component the page defines above its markup',
} as const

export const START =
  '<Sheet title="…" icon? cover? feel? theme? wsx="1"> … </Sheet> is the whole page; every block sits inside it. Run sheet_check before writing. catalog_list lists the icons, covers and themes a Sheet may wear.'

export const NEXT =
  'Call wsx_reference with primitives: ["Table", "Callout", …] for each one’s props (type, required, values) and an example that passes.'

export const STYLED_WORDS =
  'Every primitive also takes variant · tone · size · emphasis and class (layout tokens), and span (1–12) inside a Grid.'

/** How text is written in WSX, the rules sheet_check does not spell out. */
export const WRITING: Limit[] = [
  {
    title: 'Headings and paragraphs',
    detail:
      'Title (level 1–3) is a heading, Text a paragraph, List (marker bullet · number · check) holds Items, Quote, Code (lang) a block of code. There is no H1, P, Markdown, Heading or Link primitive. A Section title="…" groups blocks under a small heading.',
  },
  {
    title: 'Inline marks',
    detail:
      'Words inside Text, Item, Title, Quote, Callout, Card, a written Table cell and any block that holds words read **strong**, *em* or _em_, ~~strike~~, `code` and [a link](https://…) (https or mailto only). Marks nest: **see [docs](https://x.dev)**. Code, Kbd, Mark, Tag, Badge and other text-only primitives keep their words exactly as written. A backslash keeps a mark literal: \\*. A line break is a new Text or Item; a nested list is a List inside an Item.',
  },
  {
    title: 'Escaping { } < > &',
    detail:
      'Text holding { } < or > is written as a string literal child: <Item>{"Route `/m/{slug}` in <App>"}</Item>. A literal joins the words around it, keeping their spaces, and reads inline marks the same as plain words. HTML entities (&#123; &lt; &amp;) read the same characters; prefer the literal. & alone is fine.',
  },
  {
    title: 'Tables',
    detail:
      "A markdown table is <Table columns={['Feature', 'Status']} rows={[['Login', '**Done**'], ['Search', 'Doing']]} /> — no bind, up to 16 columns and 200 rows, each cell words (inline marks read), a number, true/false or null. A table of rows the team keeps is a database: db_define, then <Table bind={{ table: 'issues' }} columns={['title', 'status']} /> or <Database table=\"issues\" />.",
  },
  {
    title: 'Links between pages',
    detail:
      '<Ref sheet="<page id>">words</Ref> links a page inside Text; <PageLink sheet="<page id>" /> is one page as a block; <Subpages /> lists this page’s sub-pages live (layout list · cards · gallery) — make them with sheet_create and parentId; <Backlinks /> lists who links here; <Include sheet="<id>" /> draws another page’s blocks. Ref, PageLink and Include count in the other page’s backlinks.',
  },
]

/** More ways to write a primitive than its specimen shows, each one that passes. */
export const ALSO: Record<string, string[]> = {
  Table: [
    "<Table columns={['Feature', 'Status', 'Owner']} rows={[['Sign-in', '**Done**', 'Rin'], ['Search', '`/s/{query}`', null]]} />",
  ],
  Text: ['<Text>Read **this** first, then the [guide](https://example.com/guide).</Text>'],
  Item: ['<List><Item>{"Route `/m/{slug}` stays <App>’s"}</Item></List>'],
  Ref: ['<Text>See <Ref sheet="<page id>">the spec</Ref> for why.</Text>'],
}
