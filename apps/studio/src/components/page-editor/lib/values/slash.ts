import type { SlashEntry, SlashGroup, SlashStep, SlashStepCopy, StarterOption } from '../types'

/** How many pages `/` offers to link to at once. */
export const LINK_MATCHES = 5

/** What `/` offers to upload, and the block each becomes. */
export const UPLOAD_OPTIONS = [
  { as: 'image', label: 'Image', words: 'image picture photo' },
  { as: 'video', label: 'Video', words: 'video movie clip' },
  { as: 'audio', label: 'Audio', words: 'audio sound music recording' },
  { as: 'file', label: 'File', words: 'file document pdf attachment upload' },
] as const

export const STARTER_OPTIONS: StarterOption[] = [
  {
    block: 'steps',
    label: 'Steps',
    hint: 'A numbered how-to',
    words: 'steps how-to howto guide numbered',
    group: 'layout',
  },
  {
    block: 'compare',
    label: 'Compare',
    hint: 'Options side by side',
    words: 'compare options versus pros cons',
    group: 'layout',
  },
  {
    block: 'faq',
    label: 'FAQ',
    hint: 'Questions and answers',
    words: 'faq questions answers accordion',
    group: 'layout',
  },
  {
    block: 'bento',
    label: 'Bento',
    hint: 'Tiles in a grid',
    words: 'bento tiles grid cards dashboard',
    group: 'layout',
  },
  {
    block: 'countdown',
    label: 'Countdown',
    hint: 'Days until a date',
    words: 'countdown deadline until',
    group: 'advanced',
  },
]

export const SLASH_GROUP_ORDER: SlashGroup[] = [
  'basic',
  'media',
  'database',
  'layout',
  'advanced',
  'code',
]

export const SLASH_GROUP_LABELS: Record<SlashGroup, string> = {
  basic: 'Basic blocks',
  media: 'Media',
  database: 'Database',
  layout: 'Layout',
  advanced: 'Advanced',
  code: 'Code',
}

/** How many pages a page step lists at once; typing narrows it. */
export const STEP_PAGE_MATCHES = 30

export const SLASH_STEP_ORDER: SlashStep[] = ['link', 'view', 'progress', 'include', 'automation']

export const SLASH_STEPS: Record<SlashStep, SlashStepCopy> = {
  link: {
    label: 'Link to page',
    hint: 'A page as a link',
    words: 'link page',
    group: 'basic',
    empty: 'No page by that name.',
  },
  view: {
    label: 'Linked view',
    hint: 'Show a table here',
    words: 'linked view table database',
    group: 'database',
    empty: 'No table by that name.',
  },
  progress: {
    label: 'Progress',
    hint: 'Done over 30 days',
    words: 'progress chart done burnup',
    group: 'database',
    empty: 'No table with a status that says done.',
  },
  include: {
    label: 'Include',
    hint: 'Another page drawn here',
    words: 'include embed page synced transclude',
    group: 'advanced',
    empty: 'No page by that name.',
  },
  automation: {
    label: 'Automation',
    hint: 'Runs when a row changes',
    words: 'automation trigger rule when row',
    group: 'code',
    empty: 'No table by that name.',
  },
}

/** What `/` offers beside text, uploads and starters: each as it lands, found by its words too. */
export const SLASH_BLOCKS: SlashEntry[] = [
  {
    type: 'data',
    group: 'basic',
    key: 'subpage',
    label: 'New page inside',
    hint: 'A page in this one',
    words: 'page new subpage child',
    pick: { kind: 'subpage' },
  },
  {
    type: 'data',
    group: 'media',
    key: 'upload:gallery',
    label: 'Gallery',
    hint: 'Several pictures',
    words: 'gallery photos pictures album',
    pick: { kind: 'gallery' },
  },
  {
    type: 'data',
    group: 'media',
    key: 'unsplash',
    label: 'Unsplash photo',
    hint: 'Search free photos',
    words: 'unsplash image photo picture stock',
    pick: { kind: 'unsplash' },
  },
  {
    type: 'data',
    group: 'layout',
    key: 'columns:2',
    label: '2 columns',
    hint: 'Side by side',
    words: 'columns two side layout',
    pick: { kind: 'columns', count: 2 },
    isTopLevel: true,
  },
  {
    type: 'data',
    group: 'layout',
    key: 'columns:3',
    label: '3 columns',
    hint: 'Side by side',
    words: 'columns three side layout',
    pick: { kind: 'columns', count: 3 },
    isTopLevel: true,
  },
  {
    type: 'data',
    group: 'layout',
    key: 'tabs',
    label: 'Tabs',
    hint: 'Sections in tabs',
    words: 'tabs sections',
    pick: { kind: 'tabs' },
    isTopLevel: true,
  },
  {
    type: 'data',
    group: 'advanced',
    key: 'subpages',
    label: 'Subpages',
    hint: 'Its pages, listed',
    words: 'pages subpages children list',
    pick: { kind: 'subpages', layout: 'list' },
  },
  {
    type: 'data',
    group: 'advanced',
    key: 'subpage-gallery',
    label: 'Subpage gallery',
    hint: 'Its pages as cards',
    words: 'pages subpages children gallery covers',
    pick: { kind: 'subpages', layout: 'gallery' },
  },
  {
    type: 'data',
    group: 'advanced',
    key: 'outline',
    label: 'Outline',
    hint: 'This page’s headings',
    words: 'outline contents toc headings',
    pick: { kind: 'outline' },
  },
  {
    type: 'data',
    group: 'advanced',
    key: 'backlinks',
    label: 'Backlinks',
    hint: 'Pages linking here',
    words: 'backlinks references mentions linked',
    pick: { kind: 'backlinks' },
  },
  {
    type: 'data',
    group: 'code',
    key: 'page-code',
    label: 'Page code',
    hint: 'Code that draws this page',
    words: 'code script typescript program hooks',
    pick: { kind: 'code' },
  },
  {
    type: 'data',
    group: 'code',
    key: 'widget',
    label: 'Widget',
    hint: 'A live React component',
    words: 'widget jsx react canvas svg code',
    pick: { kind: 'widget' },
  },
  {
    type: 'data',
    group: 'code',
    key: 'terminal',
    label: 'Terminal',
    hint: 'Run a Node script',
    words: 'terminal node console script run',
    pick: { kind: 'terminal' },
  },
  {
    type: 'data',
    group: 'code',
    key: 'formula',
    label: 'Formula function',
    hint: 'A function formulas call',
    words: 'formula function fn',
    pick: { kind: 'formula' },
  },
]
