import { type RefObject, useEffect } from 'react'
import { useEditorStore } from '../editor-store'

/** Enter, Backspace and the arrows move the caret between blocks by asking for it here. */
export function useFocusRequest(id: string, ref: RefObject<HTMLTextAreaElement | null>) {
  const focus = useEditorStore((state) => (state.focus?.id === id ? state.focus : null))

  useEffect(() => {
    const field = ref.current
    if (!focus || !field) return
    field.focus()
    const at = focus.caret === 'end' ? field.value.length : focus.caret
    field.setSelectionRange(at, at)
    // Cleared once a field really has the caret: a load that runs twice must not lose it.
    useEditorStore.setState({ focusFirst: false })
  }, [focus, ref])
}
