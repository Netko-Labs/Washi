import type { WsxValue } from '@washi/wsx'
import { useState } from 'react'
import type { KnobFieldProps, SegmentsProps } from '../lib'

const INPUT =
  'h-7 w-full rounded-[8px] border border-border bg-background px-2 text-[12px] outline-none focus:border-ring'
const SEG = 'h-6 rounded-[6px] px-1.5 text-[12px]'

function Segments({ options, active, onPick }: SegmentsProps) {
  return (
    <div className="flex flex-wrap gap-0.5">
      <button
        type="button"
        onClick={() => onPick(null)}
        className={`${SEG} ${active === undefined ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60'}`}
        title="unset"
      >
        –
      </button>
      {options.map((option) => (
        <button
          type="button"
          key={String(option)}
          onClick={() => onPick(option)}
          className={`${SEG} ${active === option ? 'bg-primary text-primary-foreground' : 'text-foreground/80 hover:bg-accent/60'}`}
        >
          {String(option)}
        </button>
      ))}
    </div>
  )
}

function Json({ value, onChange }: Pick<KnobFieldProps, 'value' | 'onChange'>) {
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? (value === undefined ? '' : JSON.stringify(value, null, 1))
  const commit = () => {
    if (draft === null) return
    try {
      onChange(draft.trim() === '' ? null : (JSON.parse(draft) as WsxValue))
      setDraft(null)
    } catch {
      // keep the draft: a red border says it does not parse yet
    }
  }
  return (
    <textarea
      value={text}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      spellCheck={false}
      rows={Math.min(8, Math.max(2, text.split('\n').length))}
      className={`${INPUT} h-auto resize-y py-1 font-mono text-[11px] leading-[1.4] ${draft !== null && draft !== text ? '' : ''}`}
    />
  )
}

export function KnobField({ def, value, onChange, overridden }: KnobFieldProps) {
  const pick = (next: string | number | null) => onChange(next)
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-2 py-1.5">
      <div className="flex items-center gap-1 pt-1 font-mono text-[12px]">
        <span className={overridden ? 'text-primary' : 'text-foreground'}>{def.key}</span>
        {def.required && (
          <span className="text-muted-foreground" title="required">
            *
          </span>
        )}
        {overridden && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
            title="back to the specimen default"
          >
            reset
          </button>
        )}
      </div>
      {def.kind === 'enum' && def.options.length <= 7 && (
        <Segments options={def.options} active={value} onPick={pick} />
      )}
      {def.kind === 'enum' && def.options.length > 7 && (
        <select
          value={value === undefined ? '' : String(value)}
          onChange={(event) => {
            const raw = event.target.value
            const option = def.options.find((o) => String(o) === raw)
            pick(option ?? null)
          }}
          className={INPUT}
        >
          <option value="">–</option>
          {def.options.map((option) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </select>
      )}
      {def.kind === 'boolean' && (
        <Segments
          options={['true', 'false']}
          active={value === undefined ? undefined : String(value)}
          onPick={(next) => onChange(next === null ? null : next === 'true')}
        />
      )}
      {def.kind === 'number' && (
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={(event) =>
            onChange(event.target.value === '' ? null : Number(event.target.value))
          }
          className={INPUT}
        />
      )}
      {def.kind === 'text' && (
        <input
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
          placeholder={def.required ? 'required' : 'unset'}
          className={INPUT}
        />
      )}
      {def.kind === 'json' && <Json value={value} onChange={onChange} />}
    </div>
  )
}
