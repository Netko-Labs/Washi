import { javascript } from '@codemirror/lang-javascript'
import { EditorView } from '@codemirror/view'
import type { WsxElement } from '@washi/wsx'
import { basicSetup } from 'codemirror'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/integrations/trpc'
import { sourceTheme } from '../../source-editor'
import { SCRIPT_CHECK_MS } from '../constants'
import { useEditorStore } from '../editor-store'
import type { LockedBlock, ScriptCheck } from '../types'

/** What the code must define: `view`, `run`, or a Formula's own name. */
const entryOf = (node: WsxElement) =>
  node.name === 'Automation'
    ? 'run'
    : node.name === 'Formula' && typeof node.props.name === 'string'
      ? node.props.name
      : 'view'

const textOf = (node: WsxElement) =>
  node.children.map((child) => (child.kind === 'text' ? child.value : '')).join('')

/**
 * The script's TSX in CodeMirror. Typing is compiled after a pause; only what compiles lands in the
 * block, so the page's autosave never sends the server a script it would refuse.
 */
export function useScriptCode(block: LockedBlock) {
  const host = useRef<HTMLDivElement>(null)
  const [check, setCheck] = useState<ScriptCheck>({ status: 'ok' })

  useEffect(() => {
    const parent = host.current
    if (!parent) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let asked = 0
    const keep = (source: string) => {
      const ask = ++asked
      setCheck({ status: 'checking' })
      api.scripts.compile
        .query({ source, entry: entryOf(block.node) })
        .then((compiled) => {
          if (ask !== asked) return
          if (!compiled.ok) return setCheck({ status: 'refused', error: compiled.error })
          setCheck({ status: 'ok' })
          const { blocks } = useEditorStore.getState()
          const current = blocks.find((each) => each.id === block.id) ?? block
          if (current.kind !== 'locked') return
          const node: WsxElement = { ...current.node, children: [{ kind: 'text', value: source }] }
          useEditorStore.getState().replaceInBlock(block.id, current.node, node)
        })
        .catch(
          () =>
            ask === asked && setCheck({ status: 'refused', error: 'could not reach the compiler' }),
        )
    }
    const view = new EditorView({
      parent,
      doc: textOf(block.node),
      extensions: [
        basicSetup,
        javascript({ jsx: true, typescript: true }),
        sourceTheme(),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return
          clearTimeout(timer)
          const source = update.state.doc.toString()
          timer = setTimeout(() => keep(source), SCRIPT_CHECK_MS)
        }),
      ],
    })
    return () => {
      clearTimeout(timer)
      asked += 1
      view.destroy()
    }
    // The editor owns the text once open; the block id is all it needs to write back.
  }, [block.id])

  return { host, check }
}
