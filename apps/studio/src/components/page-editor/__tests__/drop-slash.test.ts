import { describe, expect, test } from 'bun:test'
import { newBlock } from '../lib/convert'
import { useEditorStore } from '../lib/editor-store'
import type { TextBlock } from '../lib/types'

const textOf = (id: string) =>
  (useEditorStore.getState().blocks.find((block) => block.id === id) as TextBlock | undefined)?.text

describe('a picker closed or refused', () => {
  test('leaves no `/image` behind, but never undoes what was typed meanwhile', () => {
    const picked = newBlock('text', '/image')
    const retyped = newBlock('text', '/video')
    useEditorStore.getState().load([picked, retyped])
    useEditorStore.getState().dropSlash(picked.id, '/image')
    useEditorStore.getState().setText(retyped.id, '/video of the demo')
    useEditorStore.getState().dropSlash(retyped.id, '/video')
    expect(textOf(picked.id)).toBe('')
    expect(textOf(retyped.id)).toBe('/video of the demo')
  })
})
