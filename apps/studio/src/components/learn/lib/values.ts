export const GROUP_LABELS: Record<string, string> = {
  frame: 'Frame',
  text: 'Text',
  surface: 'Surface',
  pages: 'Pages',
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
    body: 'Select, Switch, Slider and Tabs write keys the Sheet declares; expressions and filters read them. That is a page’s whole behaviour — nothing in it runs code.',
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
}

export const NAV_LINK =
  'block rounded-md px-2 py-1 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground'
