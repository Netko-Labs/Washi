import { SettingsCard } from '../shared/card'
import { STORAGE_COPY, STORAGE_FIELDS, type StorageFormProps, useStorageForm } from './lib'

const INPUT =
  'h-[34px] w-full min-w-0 rounded-[10px] border border-border bg-background px-2.5 text-[13px] outline-none focus-visible:border-primary'

/** Six fields, Test connection, then Save — which opens only for a draft that just passed. */
export function StorageForm({ isReplacing, onSaved }: StorageFormProps) {
  const form = useStorageForm(onSaved)
  const { status } = form
  const isBusy = status === 'testing' || status === 'saving'
  const refusal = typeof status === 'object' ? status.refusal : null

  return (
    <SettingsCard
      title={isReplacing ? 'Use another bucket' : 'Use your own bucket'}
      desc={STORAGE_COPY.formDesc}
    >
      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
        {STORAGE_FIELDS.map((field) => (
          <label key={field.key} className="grid gap-1.5 text-[12.5px]">
            <span>{field.label}</span>
            <input
              type={field.isSecret ? 'password' : 'text'}
              autoComplete="off"
              spellCheck={false}
              value={form.draft[field.key]}
              placeholder={field.placeholder}
              onChange={(event) => form.setField(field.key, event.target.value)}
              className={INPUT}
            />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-border border-t px-4 py-3">
        <p
          className={`min-w-0 flex-1 text-[12px] ${refusal ? 'text-destructive' : 'text-muted-foreground'}`}
          aria-live="polite"
        >
          {refusal ??
            (status === 'passed'
              ? STORAGE_COPY.passed
              : status === 'testing'
                ? 'Writing a test file…'
                : 'The keys are encrypted on this server; only the key ID’s last four show here.')}
        </p>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void form.test()}
          className="h-[34px] shrink-0 rounded-[10px] border border-border bg-background px-3.5 font-medium text-[12.5px] hover:bg-accent disabled:opacity-40"
        >
          {status === 'testing' ? 'Testing…' : 'Test connection'}
        </button>
        <button
          type="button"
          disabled={status !== 'passed'}
          onClick={() => void form.save()}
          className="h-[34px] shrink-0 rounded-[10px] bg-foreground px-3.5 font-medium text-[12.5px] text-background disabled:opacity-40"
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
      </div>
    </SettingsCard>
  )
}
