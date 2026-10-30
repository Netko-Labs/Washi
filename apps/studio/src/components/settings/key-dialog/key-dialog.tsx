import { IconEye, IconEyeOff, IconX } from '@tabler/icons-react'
import { Dialog } from '@/components/shared/dialog'
import { KEY_NOTES, type KeyDialogProps, PROVIDER_META, refusalFor, sinceLabel } from '../lib'
import { useKeyDialog } from './lib'

/** A stable ref callback: React runs it on mount only, so focus is taken once. */
const focusOnMount = (node: HTMLInputElement | null) => node?.focus()

const GHOST = 'h-[38px] rounded-xl border border-border px-4 text-[13.5px] hover:bg-accent'
const PRIMARY =
  'h-[38px] rounded-xl bg-primary px-4 font-semibold text-[13.5px] text-primary-foreground disabled:opacity-50'

/** One provider at a time: connect, or see what is connected and replace or remove it. */
export function KeyDialog({
  target,
  connected,
  blurb = 'One key for the workspace, encrypted on your server',
  onSave,
  onRemove,
  onClose,
}: KeyDialogProps) {
  const meta = PROVIDER_META[target]
  const form = useKeyDialog(onSave, onClose)
  const error = form.error
  const replacing = connected !== null && (form.replacing || error !== null)
  const showForm = !connected || replacing

  return (
    <Dialog label={connected ? meta.label : `Connect ${meta.label}`} onClose={onClose}>
      <div className="flex items-center gap-2.5">
        <span
          className={`grid size-[34px] place-items-center rounded-[9px] font-extrabold text-[14px] ${meta.tint}`}
          aria-hidden
        >
          {meta.mark}
        </span>
        <div className="min-w-0">
          <div className="font-semibold text-[15px]">
            {connected ? meta.label : `Connect ${meta.label}`}
          </div>
          <div className="text-[12px] text-muted-foreground">{connected ? 'Connected' : blurb}</div>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="ml-auto grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
        >
          <IconX className="size-4" />
        </button>
      </div>

      {connected && !replacing && (
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[13px]">••••••••••••{connected.last4}</div>
            <div className="text-[12px] text-muted-foreground">
              {connected.updatedBy ? `by ${connected.updatedBy} · ` : ''}
              {sinceLabel(connected.updatedAt)}
            </div>
          </div>
          <button
            type="button"
            onClick={form.startReplacing}
            className={`${GHOST} h-[30px] px-3 text-[12.5px]`}
          >
            Replace
          </button>
        </div>
      )}

      {showForm && (
        <label className="grid gap-1.5">
          <span className="font-semibold text-[13px]">API key</span>
          <span
            className={`relative flex h-11 items-center rounded-xl border bg-card pr-10 pl-3 ${
              error ? 'border-destructive' : 'border-border focus-within:border-primary'
            }`}
          >
            <input
              type={form.shown ? 'text' : 'password'}
              value={form.secret}
              autoComplete="off"
              ref={focusOnMount}
              onChange={(event) => form.setSecret(event.target.value)}
              placeholder={meta.hint}
              className="w-full bg-transparent font-mono text-[13px] outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              aria-label={form.shown ? 'Hide the key' : 'Show the key'}
              onClick={form.toggleShown}
              className="absolute right-3 text-muted-foreground hover:text-foreground"
            >
              {form.shown ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
            </button>
          </span>
          <span className="text-[12px] text-muted-foreground">
            You will see the last four and never the rest.
          </span>
        </label>
      )}

      {error ? (
        <div className="flex gap-2.5 rounded-xl border border-[#e9b4a8] bg-[#fbe9e4] p-3 text-[13px] text-[#7f2a1c] leading-snug dark:border-[#7f2a1c] dark:bg-[#3a1a14] dark:text-[#f3c4b8]">
          <span aria-hidden>⚠</span>
          <div>
            {refusalFor(target, error)}
            <details className="mt-1 text-[11.5px] opacity-80">
              <summary className="cursor-pointer">what the server said</summary>
              {error}
            </details>
          </div>
        </div>
      ) : (
        <p className="text-[12.5px] text-muted-foreground">
          {connected && !replacing
            ? `${target === 'exa' || target === 'unsplash' ? KEY_NOTES[target].remove : 'Remove makes Washi fall asleep until another key is connected.'} Nothing already written changes.`
            : `Keys come from ${meta.from}. ${target === 'exa' || target === 'unsplash' ? KEY_NOTES[target].connect : 'The model is chosen in Settings, not here.'}`}
        </p>
      )}

      <div className="mt-1 flex justify-end gap-2">
        {connected && !replacing ? (
          <>
            <button
              type="button"
              onClick={() => void onRemove().then(onClose)}
              className={`${GHOST} text-destructive`}
            >
              Remove key
            </button>
            <button type="button" onClick={onClose} className={PRIMARY}>
              Done
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onClose} className={GHOST}>
              Cancel
            </button>
            <button
              type="button"
              disabled={!form.canSubmit}
              onClick={() => void form.submit()}
              className={PRIMARY}
            >
              {error ? 'Try again' : connected ? 'Replace' : 'Connect'}
            </button>
          </>
        )}
      </div>
    </Dialog>
  )
}
