import type { LookPart } from '@washi/paper'

export interface WorkspaceLookCardProps {
  /** Owners and admins set the brand; everyone else sees what it is. */
  canChange: boolean
}

export interface OpenLookPicker {
  part: LookPart
  anchor: HTMLElement
}
