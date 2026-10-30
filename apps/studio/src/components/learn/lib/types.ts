import type { PropRow, Recipe } from '@washi/paper/book'
import type { RefObject } from 'react'

export interface LearnGroup {
  id: string
  label: string
  names: string[]
}

export interface LearnNavProps {
  groups: LearnGroup[]
  recipes: Recipe[]
  query: string
  onQuery: (query: string) => void
}

export interface LearnNavListProps extends LearnNavProps {
  active: string | null
  onPick: () => void
}

export interface LearnSheetProps {
  source: string
  /** Where the source is shown open at first: the recipes lead with it. */
  open?: boolean
}

export interface LearnPrimitiveProps {
  name: string
}

export interface LearnPropsProps {
  rows: PropRow[]
}

export interface LearnRecipesProps {
  recipes: Recipe[]
  query: string
}

export interface ContentsState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  root: RefObject<HTMLElement | null>
}

export interface Copied {
  isCopied: boolean
  copy: (text: string) => void
}
