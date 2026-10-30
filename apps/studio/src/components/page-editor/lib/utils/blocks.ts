import type { WsxValue } from '@washi/wsx'
import { turnInto } from '../convert'
import type { Block, TextBlock } from '../types'
import { SHORTCUTS } from '../values'

/** `# `, `- `, `[] `… at the start of a plain text block turn it into that kind. */
export function applyShortcut(block: TextBlock): TextBlock | null {
  if (block.kind !== 'text') return null
  for (const [prefix, kind] of SHORTCUTS) {
    if (kind === 'divider' ? block.text === prefix : block.text.startsWith(prefix)) {
      return {
        ...turnInto(block, kind),
        text: kind === 'divider' ? '' : block.text.slice(prefix.length),
      }
    }
  }
  return null
}

/**
 * The `<Sheet>` a locked block is drawn in: the page's theme and feel, never its look — the cover
 * and icon belong to the page once, not to every block (D64).
 */
export function blockFrame(rootProps: Record<string, WsxValue>): Record<string, WsxValue> {
  const { cover: _cover, icon: _icon, ...frame } = rootProps
  return frame
}

/** Each numbered item's number: a run of numbered blocks counts from 1. */
export function numberedPositions(blocks: Block[]): number[] {
  let run = 0
  return blocks.map((block) => {
    run = block.kind === 'number' ? run + 1 : 0
    return run
  })
}

/**
 * The page is named by its heading, as in Notion: a first block that is a level-1 heading with
 * text. A row page is named by its row instead, so it never takes one.
 */
export function titleOf(blocks: Block[], sheet: { rowOf: string | null }): string | null {
  const first = blocks[0]
  if (sheet.rowOf || !first || first.kind !== 'h1') return null
  const text = first.text.trim()
  return text ? text.slice(0, 200) : null
}

/** The block `titleOf` names the page by: never merged into, deleted or turned into another kind. */
export const isTitleBlock = (blocks: Block[], id: string | undefined) =>
  blocks[0]?.kind === 'h1' && blocks[0].id === id

/** A code block's trailing blank lines go; its last line's own spaces stay. */
export const withoutTrailingLines = (code: string) => code.replace(/(\n[ \t]*)+$/, '')
