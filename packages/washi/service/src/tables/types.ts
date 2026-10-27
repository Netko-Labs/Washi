import type { Cell, InkMutation } from '@washi/ink'
import type { ExprAst } from '@washi/wsx'

export interface TeamSpace {
  /** Where to land the person: the backlog. */
  backlog: string
}

export interface TeamSpaceOptions {
  /** The routine's clock: the zone of whoever asked for the space. */
  timeZone: string
  actorId: string | null
}

export interface LinkColumnResult {
  linked: number
  created: string[]
}

export type CopyMutation = Extract<InkMutation, { kind: 'copy' }>

export interface CopyResult {
  affected: number
  ids: string[]
}

/** One `set` entry, checked: a literal cell, or an expr parsed once for every row. */
export type CopyOverride = { column: string; value: Cell } | { column: string; ast: ExprAst }
