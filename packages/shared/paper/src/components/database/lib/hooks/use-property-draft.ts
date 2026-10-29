import { useState } from 'react'
import type { PropertyDraft, PropertyPanelProps, PropertyStatus } from '../types'
import { columnKey, needsOptions, propertyProblem } from '../utils'
import { PROPERTY_TYPES } from '../values'

const BLANK: PropertyDraft = { label: '', type: 'text', options: [], typing: '' }

/** A new property as it is being named and typed, refused in words until it can land. */
export function usePropertyDraft({ onAdd, taken, onDone }: PropertyPanelProps) {
  const [draft, setDraft] = useState(BLANK)
  const [status, setStatus] = useState<PropertyStatus>({ busy: false, error: null })

  const edit = (patch: Partial<PropertyDraft>) => {
    setDraft((now) => ({ ...now, ...patch }))
    setStatus((now) => ({ ...now, error: null }))
  }

  const step = (by: number) => {
    const at = PROPERTY_TYPES.findIndex(({ type }) => type === draft.type)
    const next = PROPERTY_TYPES[(at + by + PROPERTY_TYPES.length) % PROPERTY_TYPES.length]
    if (next) edit({ type: next.type })
  }

  const submit = async () => {
    const typed = draft.typing.trim()
    const ready =
      typed && !draft.options.includes(typed)
        ? { ...draft, options: [...draft.options, typed], typing: '' }
        : draft
    setDraft(ready)
    const problem = propertyProblem(ready, taken)
    if (problem) return setStatus({ busy: false, error: problem })
    setStatus({ busy: true, error: null })
    try {
      await onAdd(columnKey(ready.label), ready.type, needsOptions(ready.type) ? ready.options : [])
      onDone()
    } catch (error) {
      setStatus({ busy: false, error: error instanceof Error ? error.message : String(error) })
    }
  }

  return { draft, status, edit, step, submit }
}
