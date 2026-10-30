import { THEME_IDS, THEMES } from '@washi/paper/registry'
import { useThemesStore } from '@washi/ui'
import { useState } from 'react'
import { Dialog } from '@/components/shared/dialog'
import { Segmented } from '../../shared/card'
import {
  type EditorSaveState,
  filledNames,
  MODE_OPTIONS,
  type ThemeEditorProps,
  TOKEN_GROUPS,
  useThemeEditor,
} from '../lib'
import { ThemeChecks } from './theme-checks'
import { ThemePreview } from './theme-preview'
import { TokenRow } from './token-row'

/** Eight colours a mode, the page they make beside them, and whether people can read it. */
export function ThemeEditor({ initial, onSave, onClose }: ThemeEditorProps) {
  const editor = useThemeEditor(initial)
  const own = useThemesStore((store) => store.themes)
  const [state, setState] = useState<EditorSaveState>({ busy: false, error: null })
  const { draft, mode } = editor
  const save = async () => {
    setState({ busy: true, error: null })
    const error = await onSave(draft)
    if (error) setState({ busy: false, error })
    else onClose()
  }

  return (
    <Dialog label={draft.id ? `Edit ${draft.name}` : 'New theme'} onClose={onClose} width={880}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={(node) => {
            if (node && !draft.id && !node.value) node.focus()
          }}
          value={draft.name}
          onChange={(event) => editor.setName(event.target.value)}
          placeholder="Name it"
          aria-label="Theme name"
          maxLength={40}
          className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 font-semibold text-[15px] outline-none focus-visible:border-primary"
        />
        <select
          value=""
          onChange={(event) => event.target.value && editor.startFrom(event.target.value)}
          aria-label="Start from a theme"
          className="h-9 rounded-xl border border-border bg-background px-2.5 text-[13px]"
        >
          <option value="">Start from…</option>
          <optgroup label="Built in">
            {THEME_IDS.map((id) => (
              <option key={id} value={id}>
                {THEMES[id].name}
              </option>
            ))}
          </optgroup>
          {own.length > 0 && (
            <optgroup label="This workspace">
              {own.map((theme) => (
                <option key={theme.id} value={`ws:${theme.slug}`}>
                  {theme.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <Segmented value={mode} options={MODE_OPTIONS} onChange={editor.setMode} />
      </div>
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <div className="grid content-start gap-3">
          {TOKEN_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-0.5 font-medium text-[11px] text-muted-foreground">{group.label}</p>
              {group.tokens.map((token) => (
                <TokenRow
                  key={token.key}
                  label={token.label}
                  value={draft[mode][token.key]}
                  onChange={(color) => editor.setToken(token.key, color)}
                />
              ))}
            </div>
          ))}
          <ThemeChecks checks={editor.checks.filter((check) => check.mode === mode)} />
        </div>
        <div className="min-h-[420px] min-w-0">
          <ThemePreview tokens={draft[mode]} />
        </div>
      </div>
      {draft.filled.length > 0 && (
        <p className="text-[12.5px] text-muted-foreground">
          The file left out {filledNames(draft.filled)} — those start as Washi’s.
        </p>
      )}
      {state.error && <p className="text-[12.5px] text-destructive">{state.error}</p>}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {editor.refusal && (
          <p role="status" className="mr-auto min-w-0 text-[12.5px] text-destructive">
            {editor.refusal}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-xl px-4 text-[13px] text-muted-foreground hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={editor.isRefused || state.busy}
          onClick={() => void save()}
          className="h-9 rounded-xl bg-foreground px-4 font-semibold text-[13px] text-background disabled:opacity-40"
        >
          {state.busy ? 'Saving…' : draft.id ? 'Save' : 'Add theme'}
        </button>
      </div>
    </Dialog>
  )
}
