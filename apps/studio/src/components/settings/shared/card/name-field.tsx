import type { NameFieldProps } from '../../lib'

/** An input and its Save, with the outcome in words underneath. */
export function NameField({ label, field, disabled, hint }: NameFieldProps) {
  const { draft, isChanged, status, commit } = field
  const failed = status !== 'idle' && status !== 'saving' && status !== 'saved'
  return (
    <div className="border-border border-t px-4 py-3 first:border-t-0">
      <label className="block text-[13.5px]" htmlFor={label}>
        {label}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id={label}
          value={draft}
          disabled={disabled}
          onChange={(event) => field.setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void commit()
          }}
          className="h-[34px] min-w-0 flex-1 rounded-[10px] border border-border bg-background px-2.5 text-[13px] outline-none focus-visible:border-primary disabled:opacity-60"
        />
        <button
          type="button"
          disabled={!isChanged || status === 'saving' || disabled}
          onClick={() => void commit()}
          className="h-[34px] shrink-0 rounded-[10px] bg-foreground px-3.5 font-medium text-[12.5px] text-background disabled:opacity-40"
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p className={`mt-1.5 text-[12px] ${failed ? 'text-destructive' : 'text-muted-foreground'}`}>
        {failed ? status : status === 'saved' && !isChanged ? 'Saved.' : hint}
      </p>
    </div>
  )
}
