import { useState } from 'react'
import { WhenInput } from '../when'
import { type AgendaEventWhenProps, eventWhen, eventWhenWords } from './lib'

/**
 * When the event is: words for a reader, the day and its hours for a member — each pick lands at
 * once and shows at once, so adding an hour is "+ Add time", then the start.
 */
export function AgendaEventWhen({ row, columns, locale, onChange }: AgendaEventWhenProps) {
  const [draft, setDraft] = useState(() => eventWhen(row, columns))
  if (!onChange) {
    const words = eventWhenWords(draft, locale)
    return words ? <p className="wsx-agenda-card-when">{words}</p> : null
  }
  return (
    <div className="wsx-agenda-card-when" data-editing>
      <WhenInput
        label="When"
        look="field"
        locale={locale}
        value={draft}
        onChange={(next) => {
          setDraft(next)
          if (next.day) onChange(next)
        }}
      />
    </div>
  )
}
