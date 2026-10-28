import type { PropRow, Recipe } from '@washi/paper/book'

export interface LearnGroup {
  id: string
  label: string
  names: string[]
}

export interface LearnNavProps {
  groups: LearnGroup[]
  query: string
  onQuery: (query: string) => void
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

export interface LearnRecipeProps {
  recipe: Recipe
}

export interface Copied {
  isCopied: boolean
  copy: (text: string) => void
}
