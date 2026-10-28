import { IconFileImport, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { SettingsCard } from '../shared/card'
import { useStewardship } from '../shared/stewardship'
import { blankDraft, draftOf, type EditorDraft, useWorkspaceThemes } from './lib'
import { ThemeCard } from './theme-card'
import { ThemeEditor } from './theme-editor'
import { ThemeImport } from './theme-import'

const BUTTON =
  'flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 font-medium text-[13px] hover:bg-accent'

/** Page themes the team made; every ⋯ → Theme lists them after the built-in ones. */
export function ThemesSection() {
  const { themes, error, save, remove } = useWorkspaceThemes()
  const { madeBy, mayChange } = useStewardship()
  const [open, setOpen] = useState<EditorDraft | 'import' | null>(null)

  return (
    <div className="grid gap-4">
      <SettingsCard
        title="This workspace’s themes"
        desc={
          themes.length === 0
            ? 'None yet. Make one from scratch or paste one from shadcn or tweakcn.'
            : `${themes.length} beside the built-in ones, in every page’s ⋯ → Theme.`
        }
      >
        <div className="flex flex-wrap gap-2 px-4 py-3">
          <button type="button" onClick={() => setOpen(blankDraft())} className={BUTTON}>
            <IconPlus className="size-4" /> New theme
          </button>
          <button type="button" onClick={() => setOpen('import')} className={BUTTON}>
            <IconFileImport className="size-4" /> Import
          </button>
        </div>
        {themes.length > 0 && (
          <ul className="border-border border-t">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                madeBy={madeBy(theme.createdBy)}
                isChangeable={mayChange(theme.createdBy)}
                onEdit={() => setOpen(draftOf(theme))}
                onRemove={() => void remove(theme.id)}
              />
            ))}
          </ul>
        )}
        {error && (
          <p className="border-border border-t px-4 py-3 text-[13px] text-destructive">{error}</p>
        )}
      </SettingsCard>
      {open === 'import' && <ThemeImport onRead={setOpen} onClose={() => setOpen(null)} />}
      {open && open !== 'import' && (
        <ThemeEditor
          key={open.id ?? 'new'}
          initial={open}
          onSave={save}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  )
}
