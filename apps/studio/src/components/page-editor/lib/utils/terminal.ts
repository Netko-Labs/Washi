import { TERMINAL_PATH } from '@washi/paper/registry'
import type { WsxElement } from '@washi/wsx'

/** A Terminal's files as its props hold them: path → `file:<id>`. */
export function filesOf(node: WsxElement): Record<string, string> {
  const { files } = node.props
  if (!files || typeof files !== 'object' || Array.isArray(files)) return {}
  return Object.fromEntries(
    Object.entries(files).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  )
}

/** The path a program opens an upload by: its own name, made plain, never one already taken. */
export function terminalPath(name: string, taken: Record<string, string>): string {
  const plain =
    name
      .replace(/[^\w.-]+/g, '-')
      .replace(/^[.-]+/, '')
      .slice(0, 100) || 'file'
  const base = TERMINAL_PATH.test(plain) ? plain : 'file'
  if (!(base in taken)) return base
  const dot = base.lastIndexOf('.')
  const [stem, ext] = dot > 0 ? [base.slice(0, dot), base.slice(dot)] : [base, '']
  let n = 2
  while (`${stem}-${n}${ext}` in taken) n += 1
  return `${stem}-${n}${ext}`
}

export function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
