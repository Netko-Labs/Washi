export const GROUP_LABELS: Record<string, string> = {
  frame: 'Frame',
  text: 'Text',
  surface: 'Surface',
  pages: 'Pages',
  media: 'Media',
  explain: 'Explain',
  dataOut: 'Data out',
  dataIn: 'Data in',
  flow: 'Flow',
  kit: 'Kit',
}

/** How a page is put together, before any one primitive. */
export const BASICS = [
  {
    title: 'A page is a tree of primitives',
    body: 'Every page is one Sheet holding blocks from a closed set. Washi writes them, you edit them, and both go through the same check before anything is saved.',
  },
  {
    title: 'Components own the look',
    body: 'A block picks a variant, a tone, a size and an emphasis. The theme turns those into colours and type, so a page reads right in light, dark and every theme.',
  },
  {
    title: 'Data is bound, not pasted',
    body: 'Table, Board, Agenda, Chart and friends take a bind: a query over one of the workspace’s tables. When a row changes anywhere, every view of it redraws.',
  },
  {
    title: 'State makes a page interactive',
    body: 'Select, Switch, Slider and Tabs write keys the Sheet declares; expressions and filters read them. The markup stays data. A page may also run its own code, above the markup — in the reader’s sandbox, with no network, writing only from a press.',
  },
]

/** The section anchors above the primitives. */
export const SECTIONS = [
  { id: 'basics', label: 'Basics' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'limits', label: 'Limits' },
]

export const COPIED_MS = 1500

export const CHILD_POLICY_LABELS = {
  none: 'No children',
  text: 'Holds text',
  nodes: 'Holds blocks',
  component: 'Draws one of the page’s components',
}

export const NAV_LINK =
  'block rounded-md px-2 py-1 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground aria-[current=location]:bg-accent aria-[current=location]:font-medium aria-[current=location]:text-foreground'

/** A heading clears the sticky header, and under `md` the sticky search bar too. */
export const ANCHOR_OFFSET = 'scroll-mt-28 md:scroll-mt-20'

/** Where the scroll-spy reads: below the sticky bars, the upper half of the screen. */
export const SPY_MARGIN = '-112px 0px -55% 0px'

/** Words a newcomer searches with that no summary says, by the primitive they mean. */
export const SEARCH_WORDS: Record<string, string> = {
  Board: 'kanban cards columns drag',
  Agenda: 'calendar schedule events week month',
  Slots: 'booking appointment calendly schedule meeting',
  Chart: 'graph plot bar line pie donut',
  Form: 'input add row survey submit',
  Table: 'spreadsheet rows list',
  Database: 'notion spreadsheet views',
  Roadmap: 'gantt timeline plan',
  Heatmap: 'habit streak contributions',
  Stat: 'kpi metric number figure',
  Gallery: 'photos images pictures',
  Embed: 'iframe youtube video',
  Steps: 'how-to tutorial guide',
  Faq: 'questions answers',
  Countdown: 'timer deadline',
  Columns: 'layout side by side',
  Bento: 'tiles layout dashboard',
  Terminal: 'node script console',
  Widget: 'custom drawing iframe',
  Automation: 'trigger rule workflow',
  Formula: 'function computed',
}

export const SEARCH_SUGGESTIONS = ['Board', 'Table', 'Form']

export const CONTENTS_ID = 'learn-contents'
