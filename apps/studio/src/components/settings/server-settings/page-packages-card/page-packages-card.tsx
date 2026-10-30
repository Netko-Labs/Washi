import { IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { SettingsCard } from '../../shared/card'
import { PAGE_PACKAGES_COPY, type PagePackagesCardProps, packageState } from '../lib'

/** The npm packages page code may import (D116): a row per package, its install in words. */
export function PagePackagesCard({ packages, onAdd, onRemove }: PagePackagesCardProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const add = async () => {
    if (!draft.trim()) return
    const refused = await onAdd(draft)
    setError(refused)
    if (refused === null) setDraft('')
  }

  return (
    <SettingsCard title={PAGE_PACKAGES_COPY.title} desc={PAGE_PACKAGES_COPY.desc}>
      {packages.length > 0 ? (
        <ul>
          {packages.map((row) => (
            <li
              key={row.name}
              className="flex items-center gap-3 border-border border-b px-4 py-2.5 last:border-b-0"
            >
              <span className="font-mono text-[13px]">{row.name}</span>
              <span
                className={`min-w-0 flex-1 truncate text-[12.5px] ${row.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`}
                title={row.error ?? undefined}
              >
                {packageState(row)}
              </span>
              <button
                type="button"
                aria-label={`Remove ${row.name}`}
                onClick={() => void onRemove(row.name)}
                className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-destructive"
              >
                <IconX className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 pt-3 text-[13px] text-muted-foreground">{PAGE_PACKAGES_COPY.empty}</p>
      )}
      <form
        className="flex gap-2 border-border border-t px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault()
          void add()
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={PAGE_PACKAGES_COPY.placeholder}
          aria-label={PAGE_PACKAGES_COPY.title}
          className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 font-mono text-[13px] outline-none focus-visible:border-primary"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="h-9 shrink-0 rounded-xl border border-border px-4 font-semibold text-[13px] hover:bg-accent disabled:opacity-50"
        >
          Install
        </button>
      </form>
      {error && (
        <p className="border-border border-t px-4 py-3 text-[13px] text-destructive">{error}</p>
      )}
    </SettingsCard>
  )
}
