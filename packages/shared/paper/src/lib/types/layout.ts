import type { BlockProps, Gap } from './style'

export type TileShape = 'square' | 'wide' | 'tall' | 'big' | 'banner'

export interface ColumnsProps extends BlockProps {
  gap?: Gap
}

export interface ColumnProps extends BlockProps {
  ratio?: number
}

export interface BentoProps extends BlockProps {
  gap?: Gap
  columns?: 3 | 4 | 6
}

export interface TileProps extends BlockProps {
  shape?: TileShape
  title?: string
}
