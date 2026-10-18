import { javascript } from '@codemirror/lang-javascript'
import { linter, lintGutter } from '@codemirror/lint'
import { Prec, Transaction } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { useEffect, useRef } from 'react'
import { useSourceStore } from '../source-store'
import { sourceTheme, toLint } from '../utils'

/** Mounts CodeMirror on the returned ref, typing into the source store and taking its absorbs. */
export function useCodeMirror() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parent = host.current
    if (!parent) return
    const view = new EditorView({
      parent,
      doc: useSourceStore.getState().draft,
      extensions: [
        basicSetup,
        javascript({ jsx: true }),
        sourceTheme(),
        EditorView.lineWrapping,
        lintGutter(),
        linter((view) => toLint(view.state.doc, useSourceStore.getState().diagnostics), {
          delay: 250,
        }),
        // Saving is automatic; this keeps the browser's own Save dialog away.
        Prec.high(keymap.of([{ key: 'Mod-s', run: () => true }])),
        EditorView.updateListener.of((update) => {
          const typed = !update.transactions.some((tr) => tr.annotation(Transaction.remote))
          if (update.docChanged && typed) {
            useSourceStore.getState().type(update.state.doc.toString())
          }
        }),
      ],
    })
    const unsubscribe = useSourceStore.subscribe((state, previous) => {
      if (state.revision === previous.revision) return
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: state.draft },
        annotations: Transaction.remote.of(true),
      })
    })
    return () => {
      unsubscribe()
      view.destroy()
    }
  }, [])

  return host
}
