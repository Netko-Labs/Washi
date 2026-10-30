import type { SheetSummary } from '@washi/domain'
import type { SlashNav, TableRef } from './types'

/** Typing pauses this long before the page is saved. */
export const SAVE_DELAY_MS = 700

/** Notion stops being readable past this many columns; a drop beyond it lands below instead. */
export const MAX_COLUMNS = 5

/** A column's share runs 1–6 (the registry's bound). */
export const MAX_RATIO = 6

/** The outer fifth of a block's width is a drop beside it; the rest drops above or below. */
export const SIDE_DROP = 0.2

/** How long typing in a script waits before it is compiled and, if it compiles, kept. */
export const SCRIPT_CHECK_MS = 400

/** A Tabs block holds 1–12 tabs, each label 1–60 characters (the registry's bounds). */
export const MAX_TABS = 12
export const MAX_TAB_LABEL = 60

/** Picks that open a picker first: closed or refused, the `/` they came from has nothing to keep. */
export const PICKER_KINDS: ReadonlySet<string> = new Set(['upload', 'gallery', 'unsplash'])

/** The `/` menu as it opens: no step, the first row lit. */
export const SLASH_START: SlashNav = { step: null, active: 0, query: '' }

/** Stable empties, so a block with no `/` typed never re-renders on a table or page change. */
export const NO_TABLES: TableRef[] = []
export const NO_SHEETS: SheetSummary[] = []
